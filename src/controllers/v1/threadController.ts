import mongoose from "mongoose";
import { docTypes, IComment } from "../../schemas/thread";
import { Thread } from "../../models/thread";
import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import User from "../../models/user";
import Document from "../../models/document";
import VOD from "../../models/vod";
import Alert from "../../models/alert";
import layerFiles from "../../models/layerFiles";
import layer from "../../models/layer";

export const GetThread = async (
  docModel: docTypes,
  docId: mongoose.Types.ObjectId,
  tenantId: mongoose.Types.ObjectId
) => {
  const thread = await Thread.findOneAndUpdate(
    {
      doc: docId,
      tenant: tenantId,
      docModel: docModel,
    },
    {
      $setOnInsert: {
        doc: docId,
        tenant: tenantId,
        docModel: docModel,
      },
    },
    {
      returnOriginal: false,
      upsert: true,
    }
  ).populate("doc");
  return thread;
};

export const CreateThread = async (
  docModel: docTypes,
  docId: mongoose.Types.ObjectId,
  tenantId: mongoose.Types.ObjectId
) => {
  const thread = await Thread.create({
    doc: docId,
    tenant: tenantId,
    docModel: docModel,
  });
  await thread.populate("doc");
  return thread;
};

const updateDoc = async (
  docId,
  tenantId,
  docModel,
  isThreadExist,
  commentCount
) => {
  const updateValue = {
    isThreadExist,
    commentCount,
  };
  switch (docModel) {
    case "document":
      await Document.update(
        {
          _id: docId,
          tenantId,
        },
        {
          $set: updateValue,
        }
      );
      break;
    case "vod":
      await VOD.update(
        {
          _id: docId,
          tenantId,
        },
        {
          $set: updateValue,
        }
      );
      break;
    case "alert":
      await Alert.update(
        {
          _id: docId,
          tenantId,
        },
        {
          $set: updateValue,
        }
      );
      break;
    case "layer":
      await layer.update(
        {
          _id: docId,
          tenantId,
        },
        {
          $set: updateValue,
        }
      );
      break;
    case "layerfile":
      await layerFiles.update(
        {
          _id: docId,
          tenantId,
        },
        {
          $set: updateValue,
        }
      );
      break;
    default:
      console.log("Incorrect Doc Model.");
  }
};

export const CreateOrUpdateComment = async (
  docModel: docTypes,
  docId: mongoose.Types.ObjectId,
  tenantId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  content: string,
  commentId?: mongoose.Types.ObjectId | undefined
) => {
  if (commentId) {
    return await Thread.update(
      {
        doc: docId,
        tenant: tenantId,
        docModel: docModel,
        "comments._id": commentId,
      },
      { $set: { "comments.$.content": content } }
    );
  } else {
    const user = await User.findOne({
      _id: userId,
      tenantId: tenantId,
    });
    const comment = {
      author: userId,
      authorName: user.name,
      avatar: user.avatar,
      content: content,
    } as IComment;

    const response = await Thread.findOneAndUpdate(
      {
        doc: docId,
        tenant: tenantId,
        docModel: docModel,
      },
      {
        $push: {
          comments: comment,
        },
      },
      { new: true }
    );
    await updateDoc(docId, tenantId, docModel, true, response.comments.length);
    return response;
  }
};

export const DeleteComment = async (
  docModel: docTypes,
  docId: mongoose.Types.ObjectId,
  tenantId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  commentId: mongoose.Types.ObjectId
) => {
  const response = await Thread.findOneAndUpdate(
    {
      doc: docId,
      tenant: tenantId,
      docModel: docModel,
    },
    {
      $pull: {
        comments: {
          _id: commentId,
          author: userId,
        },
      },
    },
    { new: true }
  );
  const commentLength = response.comments.length;
  await updateDoc(
    docId,
    tenantId,
    docModel,
    commentLength === 0 ? false : true,
    commentLength
  );
  return response;
};

export const CreateDocThread = async (
  req: Request<{ docType: docTypes; docId: mongoose.Types.ObjectId }>,
  res: AuthResponse
) => {
  const thread = await CreateThread(
    req.params.docType,
    req.params.docId,
    res.locals.user.tenantId._id
  );
  if (thread == null) {
    return res.status(400).json({
      status: false,
      message: "Unable to create thread",
    });
  }
  return res.status(201).json({
    status: true,
    message: "Thread created",
    data: thread,
  });
};

export const GetDocThread = async (
  req: Request<{ docType: docTypes; docId: mongoose.Types.ObjectId }>,
  res: AuthResponse
) => {
  const thread = await GetThread(
    req.params.docType,
    req.params.docId,
    res.locals.user.tenantId._id
  );
  if (thread == null) {
    return res.status(404).json({
      status: false,
      message: "Unable to get thread",
    });
  }
  return res.json({
    status: true,
    message: "Thread retrieved",
    data: thread,
  });
};

export const AddorUpdateDocComment = async (
  req: Request<
    { docType: docTypes; docId: mongoose.Types.ObjectId },
    never,
    { content: string; commentId: mongoose.Types.ObjectId | undefined }
  >,
  res: AuthResponse
) => {
  if (!req.body.commentId) {
    const comment = await CreateOrUpdateComment(
      req.params.docType,
      req.params.docId,
      res.locals.user.tenantId._id,
      res.locals.user._id,
      req.body.content
    );
    if (comment == null) {
      return res.status(400).json({
        status: false,
        message: "Unable to create comment",
      });
    }
    return res.status(201).json({
      status: true,
      data: comment,
      message: `Comment created`,
    });
  } else {
    const comment = await CreateOrUpdateComment(
      req.params.docType,
      req.params.docId,
      res.locals.user.tenantId._id,
      res.locals.user._id,
      req.body.content,
      req.body.commentId
    );
    if (comment == null) {
      return res.status(400).json({
        status: false,
        message: "Unable to update comment",
      });
    }
    return res.status(201).json({
      status: true,
      data: comment,
      message: `Comment update`,
    });
  }
};

export const RemoveDocComment = async (
  req: Request<
    {
      docType: docTypes;
      docId: mongoose.Types.ObjectId;
      commentId: mongoose.Types.ObjectId;
    },
    never
  >,
  res: AuthResponse
) => {
  const comment = await DeleteComment(
    req.params.docType,
    req.params.docId,
    res.locals.user.tenantId._id,
    res.locals.user._id,
    req.params.commentId
  );
  if (comment == null) {
    return res.status(400).json({
      status: false,
      message: "Unable to remove alert comment",
    });
  }
  return res.status(201).json({
    status: true,
    message: "Comment removed",
  });
};
