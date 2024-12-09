import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID')
    }

    const like = await Like.findOne({ video: videoId, likedBy: req.user._id})
    // const user = await Like.findOne({ likedBy: req.user._id });
    console.log("like : ", like);
    
    
    if(like){
        if (like.likedBy.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not authorized to remove this like")
        } 

        await Like.findByIdAndDelete(like._id)

        return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Like removed successfully'))

    }
    else{
        const like = await Like.create({
            video: videoId,
            likedBy: req.user._id,
        })

        return res
        .status(200)
        .json(new ApiResponse(200, { like }, 'Like added successfully'))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    console.log("in like comment");
    
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, 'Invalid comment ID')
    }

    const like = await Like.findOne({ comment: commentId, likedBy: req.user._id })
    
    
    if(like){
        if (like.likedBy.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not authorized to remove this like")
        } 

        await Like.findByIdAndDelete(like._id)

        return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Like removed successfully'))

    }
    else{
        const like = await Like.create({
            comment: commentId,
            likedBy: req.user._id,
        })

        return res
        .status(200)
        .json(new ApiResponse(200, { like }, 'Like added successfully'))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, 'Invalid comment ID')
    }

    const like = await Like.findOne({ tweet: tweetId, likedBy: req.user._id })
    console.log("like : ", like);   
    
    if(like){
        if (like.likedBy.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not authorized to remove this like")
        } 

        await Like.findByIdAndDelete(like._id)

        return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Like removed successfully'))

    }
    else{
        const like = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id,
        })

        return res
        .status(200)
        .json(new ApiResponse(200, { like }, 'Like added successfully'))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id), // Match the user by `userId`
            },
        },
        {
            $lookup: {
                from: "videos", 
                localField: "video",
                foreignField: "_id",
                as: "likedvideos" 
            }
        },
        {
            $unwind: {
                path: "$likedvideos",
                preserveNullAndEmptyArrays: false, // Remove documents without a matching video
            },
        },
        {
            $project: {           
                _id: 0,           
                videoFile: "$likedvideos.videoFile",
            }
        }
    ])

    console.log("video aggregation : ", likedVideos);

    if (!likedVideos) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], 'No liked videos found'))
    }

    
    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideos, "liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}