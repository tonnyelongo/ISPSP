const express=require("express");
const router=express.Router();

router.get("/",(req,res)=>{
    res.send("<h1>HOME ON MEMORY</h1>")
})

module.exports=router