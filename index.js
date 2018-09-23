const puppeteer = require('puppeteer');
const resolve = require('path').resolve
const app = require('express')()
const port = 4200
const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`))
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
		puppeteer.launch().then(async (browser)=>{
		  	browsers[id] = await browser.newPage();
	  	    // await browsers[id].setViewport({width: 1366, height: 768});
	  		browsers[id].goto('https://web.skype.com/en/');
	  });
	}
	socket.on('event', (event)=>{
		switch(event.type){
			case 'keyPress':
				const key = event.data.key;
				// let keyString = String.fromCharCode(key);
				// console.log(key, keyString);
				browsers[id].keyboard.press(key);
				break;
			case 'click':
				const {widthRatio, heightRatio} = event.data;
				const {height, width} = browsers[id].viewport()
				const x = widthRatio * width;
				const y = heightRatio * height; 
				browsers[id].mouse.click(x, y);
				break;
			default:
		}
	});

	socket.on('disconnect', ()=>{
		browsers[id].close();
		delete browsers[id];
	});
});
