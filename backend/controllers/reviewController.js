import reviewModel from "../Models/reviewModel.js";

const getAllReview=async(req,res,next)=>{

    

    try{
      const  review=await reviewModel.find();
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
    }
    return res.status(200).json({review});

   }catch(err){
    console.error(err);
    return res.status(500).json({ message: "Server error" });
   }
};
   

const addReview=async(req,res,next)=>{
 
    

    
    try{
        const{name,comment,rate}=req.body;
        const nreview = new reviewModel({ name, comment, rate });
        await nreview.save();
        return res.status(201).json({ review:nreview });
    }catch(err){
        console.error(err);
        return res.status(500).json({ message: "Can't add review" });
    }
        

};

const getById = async (req, res, next) => {
    const id = req.params.id;
    let review;

    try {
        review = await reviewModel.findById(id); 
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }

    if (!review) {
        return res.status(404).json({ message: "Review not found" }); 
    }
    return res.status(200).json({ review });
};

const updateReview=async(req,res,next)=>{
    const id=req.params.id;
    const{name,comment,rate}=req.body

    let review;

    try {
        review = await reviewModel.findByIdAndUpdate(id, { name, comment, rate }, { new: true });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }
   
    if(!review){
        return res.status(404).json({message:"review not updated"});

    }
    return res.status(200).json({review});
};

const deleteReview=async(req,res,next)=>{
    const id=req.params.id;
    let review;
    try {
        review = await reviewModel.findByIdAndDelete(id);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }
    if(!review){
        return res.status(404).json({message:"Unable delete review"});
    }
    return res.status(200).json({review});
};

export default{getAllReview,addReview,getById,updateReview,deleteReview};

