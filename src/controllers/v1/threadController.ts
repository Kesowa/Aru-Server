import mongoose from "mongoose";
import { docTypes, IComment } from "../../schemas/thread";
import { Thread } from "../../models/thread";
import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import User from "../../models/user";

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

export const CreateComment = async (
  docModel: docTypes,
  docId: mongoose.Types.ObjectId,
  tenantId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  content: string
) => {
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
  console.log(comment);
  return await Thread.updateOne(
    {
      doc: docId,
      tenant: tenantId,
      docModel: docModel,
    },
    {
      $push: {
        comments: comment,
      },
    }
  );
};

export const DeleteComment = async (
  docModel: docTypes,
  docId: mongoose.Types.ObjectId,
  tenantId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  commentId: mongoose.Types.ObjectId
) => {
  return await Thread.updateOne(
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
    }
  );
};

export const CreateDocThread = async (
  req: Request<{  docType: docTypes, docId: mongoose.Types.ObjectId }>,
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
  req: Request<{ docType: docTypes, docId: mongoose.Types.ObjectId }>,
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

export const AddDocComment = async (
  req: Request<{ docType: docTypes, docId: mongoose.Types.ObjectId }, never, { content: string }>,
  res: AuthResponse
) => {
  const comment = await CreateComment(
    req.params.docType,
    req.params.docId,
    res.locals.user.tenantId._id,
    res.locals.user._id,
    req.body.content
  );
  if (comment == null) {
    return res.status(400).json({
      status: false,
      message: "Uunable to create comment",
    });
  }
  return res.status(201).json({
    status: true,
    message: "Comment created",
  });
};

export const RemoveDocComment = async (
  req: Request<
    { docType: docTypes, docId: mongoose.Types.ObjectId; commentId: mongoose.Types.ObjectId },
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
