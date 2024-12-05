import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      console.log("req in multer : ", req);
      console.log("file in multer : ", file);
      
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      console.log("req in multer : ", req);
      console.log("file in multer : ", file);
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
})