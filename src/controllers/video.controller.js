import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    // console.log("Received userId:", userId);

    // if (userId && !isValidObjectId(userId)) {
    //     throw new ApiError('Invalid userId', 400)
    // }

    // const videos = await User.aggregate([
    //     {
    //         $match: {
    //             _id: await new mongoose.Types.ObjectId(userId) // Match the user by `userId`
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "videos", 
    //             localField: "_id", 
    //             foreignField: "owner",
    //             as: "uservideos" 
    //         }
    //     },
    //     {
    //         $project: {           
    //             _id: 0,           
    //             //username: 1,      
    //             //userVideos: 1 
    //             // if you want only video
    //             userVideos: {
    //                 $map: {
    //                     input: "$userVideos",
    //                     as: "tweet",
    //                     in: "$$video.videoFile" // Extract only the `content` field from each tweet
    //                 }
    //             } 
    //         }
    //     }
    // ])

    
})

const publishAVideo = asyncHandler(async (req, res) => {
    console.log("in publish video");
    console.log("req.files: ", req.files);
    
    const { title, description } = req.body;

    // Validate required fields
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required.");
    }

    // Validate video and thumbnail file presence
    const videolocalpath = req.files?.videoFile?.[0]?.path;
    const thumbnailPath = req.files?.thumbnail?.[0]?.path;

    console.log("video local path  : ", videolocalpath);
    

    if (!videolocalpath) {
        throw new ApiError(400, "A video file is required.");
    }

    if (!thumbnailPath) {
        throw new ApiError(400, "A thumbnail image is required.");
    }

    // Upload video to Cloudinary
    const videoFile = await uploadOnCloudinary(videolocalpath);
    if (!videoFile || !videoFile.url) {
        throw new ApiError(500, "Failed to upload video to Cloudinary.");
    }

    // Upload thumbnail to Cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailPath);
    if (!thumbnail || !thumbnail.url) {
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary.");
    }

    // Save video details in the database
    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner: req.user._id,
        duration: videoFile.duration || 0,
        views: videoFile.views || 0,
        isPublished: false,
    });

    if (!video) throw new ApiError(500, 'Error creating video')


    // Return success response with video details
    return res.status(200).json(
        new ApiResponse(200, video, "Video published successfully.")
    );    
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}