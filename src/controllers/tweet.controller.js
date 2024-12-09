import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    console.log("content is : ", content);
    
    if(!content || content.trim() === ''){
        throw new ApiError(400, "content is required")
    }
    const user = await User.findById(req.user?._id);
    if(!user){
        throw new ApiError(400, "user not authorised");
    }
    console.log("hello cross user");
    
    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    });

    console.log("hello cross tweet : ", tweet);
    if(!tweet){
        throw new ApiError(500, "tweet is not created")
    }

    await tweet.save();

    return res.status(200).json(
        new ApiResponse(200, tweet, "tweet is created successfully")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    console.log("Received userId:", userId);

    if (userId && !isValidObjectId(userId)) {
        throw new ApiError('Invalid userId', 400)
    }
       
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: await new mongoose.Types.ObjectId(userId) 
            }
        },
        {
            $lookup: {
                from: "users", 
                localField: "_id", 
                foreignField: "owner",
                as: "userTweets" 
            }
        },
        {
            $project: {           
                _id: 0,           
                content: 1
            }
        }
    ]);
    
    console.log("Pipeline Result:", tweets);

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweets, "User tweets fetched successfully")
    )


});

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    const {content} = req.body;

    console.log("content to update : ", content);
    

    if (!content) {
        throw new ApiError(400, "content required")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        {new: true}
        
    )

    console.log("tweet to update : ", tweetId);
    

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    // console.log("tweetId : ", tweetId);

    // if(!tweetId){
    //     throw new ApiError(400, "user not valid")
    // }

    const tweets = await Tweet.find({ tweetId });
    console.log("tweet._id : ", tweets);
    

    if(!tweets){
        throw new ApiError(400, "user not valid")
    }
    await Tweet.deleteOne({ _id: tweetId });

    return res
    .status(200)
    .json(new ApiResponse(200, "tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}