import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    console.log("in getVideoComments");
    
    const {videoId} = req.params
    // const {page = 1, limit = 10} = req.query
    if (videoId && !isValidObjectId(videoId)) {
        throw new ApiError('Invalid videoId', 400)
    }
    console.log("video id is valid");
    

    const comments = await Video.aggregate([
        {
            $match: {
                _id: await new mongoose.Types.ObjectId(videoId) // Match the video by `videoId`
            }
        },
        {
            $lookup: {
                from: "comments", 
                localField: "_id", 
                foreignField: "video",
                as: "videoComments" 
            }
        },
        {
            $project: {           
                _id: 0,           
                //username: 1,      
                //videoComments: 1 
                // if you want only content
                videoComments: {
                    $map: {
                        input: "$videoComments",
                        as: "comment",
                        in: "$$comment.content" // Extract only the `content` field from each tweet
                    }
                } 
            }
        }
    ]);

    console.log("Pipeline Result:", comments);

    return res
    .status(200)
    .json(
        new ApiResponse(200, comments, "video comments fetched successfully")
    )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    console.log("in add comment");
    
    const {content} = req.body;
    const {videoId} = req.params;
    if(!content){
        throw new ApiError(200, "content is required")
    }
    if(!videoId){
        throw new ApiError(200, "video is not valid")
    }

    const user = await User.findById(req.user?._id);

    if(!user){
        throw new ApiError(400, "user not authorised");
    }

    const comment = await Comment.create({
        content,
        owner: req.user._id,
        video : videoId
    });

    if(!comment){
        throw new ApiError(500, "comment is not created")
    }

    await comment.save();

    return res.status(200).json(
        new ApiResponse(200, comment, "comment added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {content} = req.body;
    console.log("content to update : ", content);
    

    if (!content) {
        throw new ApiError(400, "content required")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {new: true}
        
    )

    console.log("comment to update : ", commentId);
    

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;

    const comments = await Comment.find({ commentId });
    console.log("tweet._id : ", comments);
    

    if(!comments){
        throw new ApiError(400, "comment not valid")
    }
    await Comment.deleteOne({ _id: commentId });

    return res
    .status(200)
    .json(new ApiResponse(200, "tweet deleted successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }