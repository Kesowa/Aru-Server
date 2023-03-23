import mongoose from "mongoose";
import { docTypes, IComment } from "../../schemas/thread";
import { Thread } from "../../models/thread";
import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";

export const GetThread = async (
  docModel: docTypes,
  docId: mongoose.Types.ObjectId,
  tenantId: mongoose.Types.ObjectId
) => {
  const thread = await Thread.findOneAndUpdate({
    doc: docId,
    tenant: tenantId,
    docModel: docModel,
  }, 
  {
      $setOnInsert: {
        doc: docId,
        tenant: tenantId,
        docModel: docModel,
      }
    },
    {
      returnOriginal: false,
      upsert: true
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
  const comment = {
    author: userId,
    content: content,
  } as IComment;
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

export const CreateAlertThread = async (
  req: Request<{ docId: mongoose.Types.ObjectId }>,
  res: AuthResponse
) => {
  const thread = await CreateThread(
    "alert",
    req.params.docId,
    res.locals.user.tenantId._id
  );
  if (thread == null) {
    return res.status(400).json({
      status: false,
      message: "unable to create alert thread",
    });
  }
  return res.status(201).json({
    status: true,
    message: "alert thread created",
    data: thread,
  });
};

export const GetAlertThread = async (
  req: Request<{ docId: mongoose.Types.ObjectId }>,
  res: AuthResponse
) => {
  const thread = await GetThread(
    "alert",
    req.params.docId,
    res.locals.user.tenantId._id
  );
  if (thread == null) {
    return res.status(404).json({
      status: false,
      message: "unable to get alert thread",
    });
  }
  return res.json({
    status: true,
    message: "alert thread retrieved",
    data: thread,
  });
};

export const AddAlertComment = async (
  req: Request<{ docId: mongoose.Types.ObjectId }, never, { content: string }>,
  res: AuthResponse
) => {
  const comment = await CreateComment(
    "alert",
    req.params.docId,
    res.locals.user.tenantId._id,
    res.locals.user._id,
    req.body.content
  );
  if (comment == null) {
    return res.status(400).json({
      status: false,
      message: "unable to create alert comment",
    });
  }
  return res.status(201).json({
    status: true,
    message: "alert comment created",
  });
};

export const RemoveAlertComment = async (
  req: Request<
    { docId: mongoose.Types.ObjectId; commentId: mongoose.Types.ObjectId },
    never
  >,
  res: AuthResponse
) => {
  const comment = await DeleteComment(
    "alert",
    req.params.docId,
    res.locals.user.tenantId._id,
    res.locals.user._id,
    req.params.commentId
  );
  if (comment == null) {
    return res.status(400).json({
      status: false,
      message: "unable to remove alert comment",
    });
  }
  return res.status(201).json({
    status: true,
    message: "alert comment removed",
  });
};