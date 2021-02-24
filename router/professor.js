const express=require("express")
const router=express.Router()

router.get("/olas",(req,res)=>{
    res.send("ola mundo ")
})
/*router.get("/home",(req,res)=>{
    res.render("")
})
router.get("/add_artigo",(req,res)=>{
    res.render("")
})
router.post("/add_artigo",(req,res)=>{
    res.render("")
})
router.get("/artigos",(req,res)=>{
    res.render("")
})
router.get("/auta",(req,res)=>{
    res.render("")
})
router.get("/watch/:filename",(req,res)=>{
    res.render("")
})*/

module.exports=router;