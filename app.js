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
const fs = require('fs')
var xss = require("xss")
const admin=require("./router/admin")



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
	host     : 'bromot1yfhqwgv3bpddh-mysql.services.clever-cloud.com',
	user     : 'unu1dm8taigyorvg',
	password : 'YwBjx25vjjqrluGEvUgA',
	database : 'bromot1yfhqwgv3bpddh'
});

var storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"public/uploads")
    },
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"-"+Date.now()+file.originalname)
    }
})

var upload=multer({storage:storage})

app.set("views",__dirname+"/views")
app.set("view engine","ejs")
app.use(express.static(path.join(__dirname,"public")))



var http=require("http")
var server = http.createServer(app)
var io = require('socket.io')(server)

app.get("/",(req,res)=>{
	res.send("oi")
})

if(process.env.NODE_ENV==='production'){
	app.use(express.static(__dirname+"/build"))
	app.get("*", (req, res) => {
		res.sendFile(path.join(__dirname+"/build/index.html"))
	})
}

/*
app.get("/",(req,res)=>{
    if(req.session.loggedin){
		res.redirect("/home")
	}else{
		res.redirect("/login")
	}
})*/



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
				req.session.key=results[0]
				 res.json({message:"logado",resultado:results})
				 console.log(results)
				 console.log(results[0])
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
	connection.query("SELECT e.ID_ESTUDANTE,e.NUMERO,e.NOME,c.CODIGO,c.DESIGNACAO,e.DATA_INGRESSO FROM `ESTUDANTE` `e` INNER JOIN `CODIFICACAO2` `c` ON c.ID_COD=e.ID_CODIF  ORDER BY e.ID_ESTUDANTE DESC",function(err,rows,fields){
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

app.get("/get_admin",(req,res)=>{
	connection.query("SELECT * FROM `admin` ORDER BY id  DESC",function(err,rows,fields){
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

app.get("/get_estudante_by_id/:id",(req,res)=>{
	let id=req.params.id
	connection.query("SELECT e.ID_ESTUDANTE,e.NUMERO,e.NOME,c.CODIGO,c.DESIGNACAO,e.DATA_INGRESSO FROM `ESTUDANTE` `e` INNER JOIN `CODIFICACAO2` `c` ON c.ID_COD=e.ID_CODIF WHERE e.ID_ESTUDANTE=?   ORDER BY e.ID_ESTUDANTE DESC",[id],function(err,rows,fields){
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

app.post("/edit_estudante",(req,res)=>{
	
	let numero=req.body.numero;
	let nome=req.body.nome;
	let idcodif=req.body.id_codif;
	let senha=req.body.senha;
	let data_ingresso=req.body.data_cadastro
	let id=req.body.id_estudante


	connection.query("UPDATE `estudante` SET `ID_ESTUDANTE`=?,`NUMERO`=?,`NOME`=?,`ID_CODIF`=?,`SENHA`=?,`DATA_INGRESSO`=? WHERE ID_ESTUDANTE`=?",[numero,nome,idcodif,senha,data_ingresso,id],function(error,results,fields){
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

app.post("/remove_estudante",(req,res)=>{
	
	let id=req.body.id;



	connection.query("DELETE FROM `estudante` WHERE ID_ESTUDANTE=?",[id],function(error,results,fields){
		console.log(results);
		 if(error)
		 {
			console.log(error);
			res.json({message:"erro"})
			res.end();
		 }
		 else
		 {

		  res.json({message:"apagaado"})
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
		//res.redirect("/login")
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
	connection.query("SELECT ID_COD,CODIGO,DESIGNACAO FROM `codificacao2` ",function(err,results){
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

app.post("/upload",upload.single("ficheiro"),(req,res,next)=>{
    const file=req.file
    if(!file){
        const erro=new error("Selecione um Ficheiro")
        return next.error(error)
    }
    console.log(req.session.key)

	let type=file.mimetype;
	let name=file.filename;
	let uid=1//req.session.key.id;
	let codigo=req.body.codigo;
	let desc=req.body.desc;

	connection.query("INSERT INTO `artigos`(`ID`, `CODIGO`, `USUARIO_ID`, `DESCRICAO`, `FICHEIRO`, `TIPO`, `DATA_CRIACAO`) VALUES (NULL,?,?,?,?,?,CURRENT_DATE)",[codigo,uid,desc,name,type],function(error,results,fields){
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
})

app.get("/get_artigos",(req,res)=>{

	let codigo="ALAM10CFB"

	connection.query("SELECT * FROM `artigos` WHERE CODIGO=?",[codigo],function(error,results,fields){

		 if(error)
		 {
			console.log(error);
			res.json("erro")
			res.end();
		 }
		 else
		 {

		  res.json(results)

		  res.end();
			 
			 

		 }
	})

})


app.use(subdomain('admin', admin));
app.set('port', 8080)

sanitizeString = (str) => {
	return xss(str)
}

connections = {}
messages = {}
timeOnline = {}

io.on('connection', (socket) => {
	console.log("connectado")

	socket.on('join-call', (path) => {
		if(connections[path] === undefined){
			connections[path] = []
		}
		connections[path].push(socket.id)

		timeOnline[socket.id] = new Date()

		for(let a = 0; a < connections[path].length; ++a){
			io.to(connections[path][a]).emit("user-joined", socket.id, connections[path])
		}

		if(messages[path] !== undefined){
			for(let a = 0; a < messages[path].length; ++a){
				io.to(socket.id).emit("chat-message", messages[path][a]['data'], 
					messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
			}
		}

		console.log(path, connections[path])
	})

	socket.on('signal', (toId, message) => {
		io.to(toId).emit('signal', socket.id, message)
	})

	socket.on('chat-message', (data, sender) => {
		data = sanitizeString(data)
		sender = sanitizeString(sender)

		var key
		var ok = false
		for (const [k, v] of Object.entries(connections)) {
			for(let a = 0; a < v.length; ++a){
				if(v[a] === socket.id){
					key = k
					ok = true
				}
			}
		}

		if(ok === true){
			if(messages[key] === undefined){
				messages[key] = []
			}
			messages[key].push({"sender": sender, "data": data, "socket-id-sender": socket.id})
			console.log("message", key, ":", sender, data)

			for(let a = 0; a < connections[key].length; ++a){
				io.to(connections[key][a]).emit("chat-message", data, sender, socket.id)
			}
		}
	})

	socket.on('disconnect', () => {
		var diffTime = Math.abs(timeOnline[socket.id] - new Date())
		var key
		for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
			for(let a = 0; a < v.length; ++a){
				if(v[a] === socket.id){
					key = k

					for(let a = 0; a < connections[key].length; ++a){
						io.to(connections[key][a]).emit("user-left", socket.id)
					}
			
					var index = connections[key].indexOf(socket.id)
					connections[key].splice(index, 1)

					console.log(key, socket.id, Math.ceil(diffTime / 1000))

					if(connections[key].length === 0){
						delete connections[key]
					}
				}
			}
		}
	})
})

server.listen(app.get('port'), () => {
	console.log("listening on", app.get('port'))
})
