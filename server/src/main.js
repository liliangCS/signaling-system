const ws = require("ws")
const { PORT } = require("./serverConfig")

const server = new ws.Server({
  port: PORT
})

// 终端列表
let clientList = []
// 终端id
let clientID = 1

// 打印在线人数
const PrintOnlineUserCount = () => {
  console.log(`当前在线人数：${clientList.length}`)
}

server.on("connection", (socket) => {
  clientList.push({ clientID: clientID, client: socket })
  WSListener(clientID++, socket)
  console.log("有人进入房间")
  PrintOnlineUserCount()
})

const WSListener = (clientID, socket) => {
  // 客户端关闭
  socket.on("close", () => {
    clientList = clientList.filter((item) => clientID !== item.clientID)
    console.log("有人退出房间")
    PrintOnlineUserCount()
  })

  // 客户端消息转发
  socket.on("message", (data) => {
    // 并转发给其他客户端
    const clientMsg = data.toString()
    // 打印
    console.log(`接收到用户${clientID}的消息,下面开始进行转发:`)
    const otherUsers = clientList.filter((item) => clientID !== item.clientID)
    otherUsers.forEach((item) => {
      item.client.send(clientMsg)
      console.log(`已转发给用户${item.clientID}`)
    })
  })
}

server.on("listening", () => {
  console.log(`服务启动于: 127.0.0.1:${PORT}`)
})
