"use strict";

/**
 * User sessions
 * @param {Array} users
 */
const users = {};
const dummy = [
    {s: 25, n: "Zane"},
    {s: 120, n: "Drew"},
    {s: 150, n: "Faris"},
    {s: 65, n: "Dante"},
    {s: 200, n: "Lucy"},
    {s: 95, n: "Bobby"}
];

/**
 * Remove user session
 * @param {User} user
 */
function removeUser(id) {
	if (users[id]) delete users[id];
}

function prettyTime(seconds) {
    let minutes = (seconds / 60) | 0;
    seconds = seconds - (minutes * 60);
    return (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
}

/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
module.exports = {

	io: (socket) => {
        if (storage.size() <= 0) {
            storage.set("scores", dummy);
        }
        
        socket.on("clear", ()=>{
            storage.clear();
        });
        
		socket.on("disconnect", () => {
			removeUser(socket.id);
		});
        
        socket.on("login", (name) => {
			users[socket.id] = {n: name, s: 0};
            // sending to all clients except sender
            socket.broadcast.emit("new", name);
		});
        
        socket.on("scores", () => {
            storage.get("scores", dummy).then(s => {
                socket.emit("scores", s);
            });
        });
        
        socket.on("beat", (h)=>{
            socket.broadcast.emit("beat", h);
            storage.get("scores", dummy).then(s => {
                s.push(h);
                s.slice(0,149);
                storage.set("scores", s).then((ok)=>{
                    io.emit("scores", s);
                });
            });
        });
	},

	stat: (req, res) => {
		storage.get("scores", dummy).then(sc => {
            sc = sc.sort((a, b)=>{
                return a.s < b.s ? 1 : (a.s > b.s ? -1 : 0);
            });
            var h = "<h1>High scores</h1>";
            sc.forEach((s, i)=>{
                h += "<p>" + (i+1) + ". " + s.n + " - " + prettyTime(s.s) + "</p>";
            });
			res.send(h);
		});
	}

};