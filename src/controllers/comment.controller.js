import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
        return res.status(400).json(new ApiError(400, "Invalid limit parameter"));
    }
    try {
        const comments = await Comment.aggregate([
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "commeter",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                fullname: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "liked"
                }
            },
            {
                $addFields: {
                    likeCounts: {
                        $size: "$liked"
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    commenter: { $arrayElemAt: ["$commenter", 0] },
                    likesCounts: 1,
                    content: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: parsedLimit
            }
        ])
        return res
        .status(200)
        .json(
            new ApiResponse(200, comments, "Comments fetched and paginated successfully.")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching video comments")
    }
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    if(!videoId || isValidObjectId(videoId)){
        return new ApiError(400, "Enter valid video id")
    }
    const {owner} = req.user?._id
    const {content} = req.body
    if(!content){
        return new ApiError(400, "There is no content of comment")
    }
    const comment = await Comment.create({
        content,
        video: videoId,
        owner
    })
    if(!comment){
        throw new ApiError(500, "Something went wrong while adding comment")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    if(!commentId || isValidObjectId(commentId)) {
        throw new ApiError(400, "Enter valid comment id")
    }
    const {newContent} = req.body
    if (!newContent) {
        throw new ApiError(400, "New content is required");
    }
    try {
        const comment = await Comment.findById(commentId)
        if(!comment){
            throw new ApiError(404, "Comment not found")
        }
        if(!comment.owner.equals(req.user?._id)){
            throw new ApiError(409, "Only owner can update comment")
        }
        comment.content = newContent
        await comment.save()
        return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "Comment updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while updating comment.")
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if(!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Enter valid comment id")
    }
    try {
        const comment = await Comment.findByIdAndDelete(commentId)
        if(!comment)  {
            return new ApiResponse(500, "Something went wrong while deleting comment")
        }
        await Like.deleteMany({comment: commentId})
        return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "Comment deleted successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while deleting a comment")
    }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}