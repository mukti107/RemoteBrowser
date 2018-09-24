const puppeteer = require('puppeteer');
const app = require('express')()
const port = process.env.NODE_PORT || 3000
const server = app.listen(port, () => console.log(`Listening on port ${port}!`))
var io = require('socket.io')(server);
const browsers = {};
const sendScreenshot = (id, socket)=> () =>{
	if(browsers[id]){
		browsers[id].screenshot().then((img)=>{
			socket.emit('screen', img.toString('base64'));	
		});
	}
}

app.get('/', (req, res) => {
	res.sendFile(__dirname+ '/index.html');
})

io.on('connection', (socket) => {
	const id = socket.id;
	const timer = setInterval(sendScreenshot(id, socket), 700);
	if(!browsers[id]){
		puppeteer.launch().then((browser)=>{
		  	browser.newPage().then((page)=>{
		  		browsers[id] = page;
		  		browsers[id].goto('https://web.skype.com/en/');
		  	});
	  });
	}
	socket.on('event', (event)=>{
		if(browsers[id]){
		switch(event.type){
			case 'keyPress':
				const key = event.data.key;
				// let keyString = String.fromCharCode(key);
				// console.log(key, keyString);
				browsers[id].keyboard.press(key);
				break;
			case 'click':
				const widthRatio = event.data.widthRatio;
				const heightRatio = event.data.heightRatio;
				const height = browsers[id].viewport().height;
				const width = browsers[id].viewport().width;
				const x = widthRatio * width;
				const y = heightRatio * height; 
				browsers[id].mouse.click(x, y);
				break;
			default:
		}
	}
	});

	socket.on('disconnect', ()=>{
		browsers[id].close();
		delete browsers[id];
	});
});
