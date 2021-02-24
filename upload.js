const express=require("express")
const app=express()
const session=require("express-session")
var FileStore = require('session-file-store')(session);
const multer=require("multer")
const ejs=require("ejs")
const bodyParser=require("body-parser")
const path=require("path")
const mysql=require("mysql")
const subdomain=require("express-subdomain");
const proff=require("./router/professor")
const cors=require("cors")


app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

app.use(session({ secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new FileStore({logFn: function(){}}),
    cookie: { maxAge: 36000000000,secure: false, httpOnly: true }
  })
);
app.use(subdomain('private', proff));
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'almadb'
});

var storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"public/uploads")
    },
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"-"+Date.now()+file.originalname)
    }
})

var documento=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"public/uploads/documentos")
    },
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"-"+Date.now()+file.originalname)
    }
})

var video=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"public/uploads/videos")
    },
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"-"+Date.now()+file.originalname)
    }
})

var imagen=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"public/uploads/imagens")
    },
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"-"+Date.now()+file.originalname)
    }
})

var upload=multer({storage:storage})

app.set("views",__dirname+"/views")
app.set("view engine","ejs")
app.use(express.static(path.join(__dirname,"public")))


app.get("/",(req,res)=>{
    if(req.session.loggedin){
		res.redirect("/home")
	}else{
		res.redirect("/login")
	}
})

app.get("/home",(req,res)=>{
    if(req.session.loggedin){
		res.render("index")
	}else{
		res.redirect("/login")
	}
})

app.get("/publicar",(req,res)=>{
    if(req.session.loggedin){
		res.render("publicar")
	}else{
		res.redirect("/login")
	}
})
app.get("/mensagens",(req,res)=>{
    if(req.session.loggedin){
		res.render("mensagens")
	}else{
		res.redirect("/login")
	}
})

app.get("/login",(req,res)=>{
	if(req.session.loggedin){
		res.redirect("/home")
	}else{
		res.render("login")
	}
})

app.get("/recover",(req,res)=>{
	res.send("<h1>Recuperar senha</h1>")
})

app.post("/login",(req,res)=>{

	let nome=req.body.nome;//"FABIO ASSUNCAO";
	let senha=req.body.senha;//"1998MARS";

	console.log("dados: "+nome+" senha: "+senha);

	connection.query("SELECT * FROM `admin` WHERE nome=? AND password=?",[nome,senha],function(error,results,fields){
		console.log(results);
		 if(error)
		 {
			console.log(error);
			connection.end();
			res.end();
		 }
		 else
		 {
			 if(results.length>0)
			 {
				req.session.loggedin=true
				req.session.nivel=results[0].nivel
				req.session.key=results
				 res.json({message:"logado",resultado:results})
				//res.redirect("/home")
				res.end();
			 
			 }
			 else
			 {
				res.json({message:"erro"});
				//res.redirect("/login")
				//connection.end();
				res.end();
			 }
		 }
	})
	 
});
app.get("/get_estudantes",(req,res)=>{
	connection.query("SELECT e.ID_ESTUDANTE,e.NUMERO,e.NOME,c.CODIGO,c.DESIGNACAO,e.DATA_INGRESSO FROM `ESTUDANTE` `e` INNER JOIN `CODIFICACAO` `c` ON c.ID_COD=e.ID_CODIF  ORDER BY e.ID_ESTUDANTE DESC",function(err,rows,fields){
		if(err)
		{
			console.log(err);
			connection.end();
			res.end()
		}
		else
		{
			res.json(rows);;
			res.end()
		}
	   })
});

app.post("/add_estudante",(req,res)=>{
	
	let numero=req.body.numero;
	let nome=req.body.nome;
	let idcodif=req.body.id_codif;
	let senha=req.body.senha;
	let data_ingresso=req.body.data_cadastro


	connection.query("INSERT INTO `estudante` (`ID_ESTUDANTE`,`NUMERO`,`NOME`,`ID_CODIF`,`SENHA`,`DATA_INGRESSO`) VALUES (NULL,?,?,?,?,?)",[numero,nome,idcodif,senha,data_ingresso],function(error,results,fields){
		console.log(results);
		 if(error)
		 {
			console.log(error);
			res.json({message:"erro"})
			res.end();
		 }
		 else
		 {

		  res.json({message:"gravado"})
		  res.end();
			 
			 

		 }
	})
	 
});

app.get("/find_estudante/:palavra",(req,res)=>{
	
	let palavra=req.params.palavra.toString()

	connection.query("SELECT * FROM `estudante` WHERE `NUMERO` =?",[palavra],function(error,results,fields){
		console.log(results);
		 if(error)
		 {
			console.log(error);
			res.json({message:"erro"})
			res.end();
		 }
		 else
		 {

		  res.json({message:"sucesso",data:results})
		  res.end();
			 
			 

		 }
	})
	 
});

app.get("/logout",(req,res)=>{

  if(req.session.loggedin)
  {
	req.session.destroy((err)=>{
		if(err){
			console.log(err)
			res.json({message:err})
		}
        console.log("loggedout")
		res.redirect("/login")
	})
  }else{
	  return;
  }
 });

 app.get("/aulas",(req,res)=>{
	if(req.session.loggedin && req.session.nivel==2)
	{
	  res.redirect("localhost:3000/broadcast/ALAM10INF")
	  console.log("transmitir")
	  res.end()
	/*}else if(req.session.loggedin && req.session.nivel==1){
	  res.redirect("localhost:3000/view/ALAM10INF")
	  console.log("receber")
	  res.end()*/
	}else{
		return;
	}
   });

   app.get("/codigo",(req,res)=>{
	connection.query("SELECT ID_COD,CODIGO,DESIGNACAO FROM `codificacao` ",function(err,results){
		if(err)
		{
			console.log(err);
			res.end()
		}
		else
		{
			res.json({resultado:results});
			res.end()
		}
	   })
});

 app.get("/session",(req,res)=>{
  if(req.session.key!==undefined)
  {
	res.json({dados:req.session.key})
  }else{
	res.json({message:"Sem sessao guardada ainda"})
  }
 });

 app.get("/estudantes",(req,res)=>{
	if(req.session.loggedin){
		res.render("estudantes")
	}else{
		res.redirect("/login")
	}

   });

app.post("/upload",upload.single("foto"),(req,res,next)=>{
    const file=req.file
    if(!file){
        const erro=new error("Selecione um Ficheiro")
        return next.error(error)
    }
    res.send(file)
})

app.listen(8080)
