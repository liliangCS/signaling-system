const $ = (selector) => {
  return document.querySelector(selector)
}

// dom元素
const localVideoEl = $(".local>video")
const remoteVideoEl = $(".remote>video")
// 连接服务器按钮
const connBtnEl = $(".btns span:nth-of-type(1)")
// 断开服务器按钮
const breakBtnEl = $(".btns span:nth-of-type(2)")
// 本地摄像头按钮组
const btn1 = $(".local button:nth-of-type(1)")
const btn2 = $(".local button:nth-of-type(2)")
const btn3 = $(".local button:nth-of-type(3)")
const btn4 = $(".local button:nth-of-type(4)")

// 开发环境
const IS_DEV = true
// websocket url
const WEBSOCKET_URL = IS_DEV ? "ws://127.0.0.1:5000" : "ws://luoye.website:5000"
// 本地媒体流
let localMediaStream = null
// 远程媒体流
let remoteMediaStream = null
// websocket连接
let ws = null
// RTCPeerConnection
let pc = null

// 初始化本地摄像头
const init = async () => {
  // 获取本地摄像头的媒体流
  localMediaStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  })
  // 设置给video标签
  localVideoEl.srcObject = localMediaStream
}
init()

// local按钮组
btn1.addEventListener("click", () => {
  const tracks = localMediaStream.getTracks()
  const videoTrack = tracks.find((track) => track.kind === "video")
  videoTrack.enabled = true
})
btn2.addEventListener("click", () => {
  const tracks = localMediaStream.getTracks()
  const videoTrack = tracks.find((track) => track.kind === "video")
  videoTrack.enabled = false
})
btn3.addEventListener("click", () => {
  const tracks = localMediaStream.getTracks()
  const videoTrack = tracks.find((track) => track.kind === "audio")
  videoTrack.enabled = true
})
btn4.addEventListener("click", () => {
  const tracks = localMediaStream.getTracks()
  const videoTrack = tracks.find((track) => track.kind === "audio")
  videoTrack.enabled = false
})

// 连接服务器按钮
connBtnEl.addEventListener("click", async () => {
  ws = new WebSocket(WEBSOCKET_URL)
  const timer = setInterval(() => {
    switch (ws.readyState) {
      case 0:
        console.log("连接中......")
        break
      default:
        console.log(ws)
        clearInterval(timer)
        break
    }
  }, 1000)
  ws.addEventListener("open", async () => {
    alert("连接服务器成功！")
    WSEventListener(ws)
    // 创建rtc连接并添加轨道到流中
    pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "turn:luoye.website:3480",
          username: "liliang",
          credential: "123456"
        }
      ],
      iceTransportPolicy: "all",
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require"
    })
    PCEventListener(pc)
    localMediaStream.getTracks().forEach((track) => {
      pc.addTrack(track, localMediaStream)
    })
    // 创建offer
    const offer = await pc.createOffer()
    // 媒体协商
    await pc.setLocalDescription(offer)
    ws.send(`offer@${JSON.stringify(offer)}`)
  })
  // 异常监听
  ws.addEventListener("error", () => {
    alert("连接服务器失败！")
  })
})

// websocket的事件监听函数
const WSEventListener = (ws) => {
  // 消息处理
  ws.addEventListener("message", async (event) => {
    const [flag, message] = event.data.split("@")
    switch (flag) {
      case "offer": {
        const offer = JSON.parse(message)
        // 打印offer
        console.log(offer)
        console.log(offer.sdp)
        // 媒体协商
        await pc.setRemoteDescription(offer)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        ws.send(`answer@${JSON.stringify(answer)}`)
        break
      }
      case "answer": {
        const answer = JSON.parse(message)
        // 打印answer
        console.log(answer)
        console.log(answer.sdp)
        // 媒体协商
        await pc.setRemoteDescription(answer)
        break
      }
      case "candidate": {
        const candidate = JSON.parse(message)
        // 打印candidate
        console.log(candidate)
        // candidate配对
        pc.addIceCandidate(candidate)
        break
      }
    }
  })
}

// RTCPeerConnection的事件监听函数
const PCEventListener = (pc) => {
  // ice候选信息事件监听
  pc.addEventListener("icecandidate", (event) => {
    ws.send(`candidate@${JSON.stringify(event.candidate)}`)
  })
  // track事件监听
  pc.addEventListener("track", (event) => {
    // 远端媒体流
    console.log(event.streams[0])
    remoteVideoEl.srcObject = event.streams[0]
  })
}

// 断开服务器
breakBtnEl.addEventListener("click", () => {
  if (!ws) return alert("请先连接服务器！")
  try {
    ws.close()
    ws = null
    alert("服务器已断开！")
  } catch (error) {
    alert(`服务器断开失败，原因：${error.message}`)
  }
})
