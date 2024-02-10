import {
  nowInSec,
  SkyWayAuthToken,
  SkyWayContext,
  SkyWayRoom,
  SkyWayStreamFactory,
  uuidV4,
} from "@skyway-sdk/room";

const ENTER_ROOM_KEY = "enter_room";
const LEAVE_ROOM_KEY = "leave_room";
const memberList = [];
var myMemberData = {
  dataTyepe: ENTER_ROOM_KEY,
  name: "二瓶",
  id: null,
  audioID: null,
  dataID: null,
  videoID: null,
};

const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24,
  scope: {
    app: {
      id: APP_ID,
      turn: true,
      actions: ["read"],
      channels: [
        {
          id: "*",
          name: "*",
          actions: ["write"],
          members: [
            {
              id: "*",
              name: "*",
              actions: ["write"],
              publication: {
                actions: ["write"],
              },
              subscription: {
                actions: ["write"],
              },
            },
          ],

          sfuBots: [
            {
              actions: ["write"],
              forwardings: [
                {
                  actions: ["write"],
                },
              ],
            },
          ],
        },
      ],
    },
  },
}).encode(SECRET_ID);

(async () => {
  const localVideo = document.getElementById("local-video");
  const buttonArea = document.getElementById("button-area");
  const remoteMediaArea = document.getElementById("remote-media-area");
  const remoteAudioArea = document.getElementById("remote-audio-area");
  const remoteTextArea = document.getElementById("remote-text-area");

  const dataStreamInput = document.getElementById("data-stream");

  const myId = document.getElementById("my-id");
  const writeButton = document.getElementById("write");

  const { audio, video } =
    await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  video.attach(localVideo);
  await localVideo.play();

  const data = await SkyWayStreamFactory.createDataStream();
  writeButton.onclick = () => {
    var submitData = {
      name: dataStreamInput.value,
    };
    data.write(submitData);
    dataStreamInput.value = "";
  };

  const context = await SkyWayContext.Create(token);
  const channel = await SkyWayRoom.FindOrCreate(context, {
    //TODO:sfuに変更すればsfu通信に変わる（DATA通信ができないっぽい）
    type: "p2p",
    //TODO:ROOMのIDに修正
    name: "nihei",
  });
  const me = await channel.join();

  myId.textContent = me.id;

  await me.publish(audio);
  await me.publish(video);
  await me.publish(data);
  console.log("subscribeAndAttach");

  const subscribeAndAttach = async (publication) => {
    if (publication.publisher.id === me.id) return;

    const subscribeButton = document.createElement("button");
    subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
    buttonArea.appendChild(subscribeButton);
    const { stream } = await me.subscribe(publication.id);
    // console.log("------------stream-------------");
    // console.log(stream);
    switch (stream.contentType) {
      case "video":
        {
          //入ってきた人のvideoを作成する
          const divVideo = document.createElement("div");
          divVideo.setAttribute("class", "js-video-area");
          const elm = document.createElement("video");
          const inputVideoID = document.createElement("input");
          inputVideoID.setAttribute("value", stream.id);
          inputVideoID.setAttribute("class", "js-video-id");
          inputVideoID.setAttribute("type", "hidden");
          elm.playsInline = true;
          elm.autoplay = true;
          stream.attach(elm);
          divVideo.appendChild(elm);
          divVideo.appendChild(inputVideoID);
          remoteMediaArea.appendChild(divVideo);
        }
        break;
      case "audio":
        {
          const divAudio = document.createElement("div");
          divAudio.setAttribute("class", "js-audio-area");
          const elm = document.createElement("audio");
          const inputAudioID = document.createElement("input");
          inputAudioID.setAttribute("value", stream.id);
          elm.appendChild(inputAudioID);
          elm.controls = true;
          elm.autoplay = true;
          stream.attach(elm);
          divAudio.appendChild(elm);
          divAudio.appendChild(inputAudioID);
          remoteAudioArea.appendChild(divAudio);
        }
        break;
      case "data": {
        const elm = document.createElement("div");
        remoteTextArea.appendChild(elm);
        elm.innerText = "data\n";
        myMemberData.id = me.id;
        myMemberData.audioID = me.id;
        myMemberData.dataID = audio.id;
        myMemberData.videoID = video.id;

        stream.onData.add((receiveData) => {
          //NOTE:きたデータを取る
          if (receiveData.dataTyepe == ENTER_ROOM_KEY) {
            addMember(receiveData, elm);
          } else if (receiveData.dataTyepe == LEAVE_ROOM_KEY) {
            deleteMember(receiveData.id);
          } else {
            elm.innerText += receiveData + "\n";
          }
        });

        //NOTE:入ってきた人にいｊぶデータ通信が確立されたときにその人に向けて自分のUserIDと表示の名前を送信する
        data.write(myMemberData);
      }
    }
  };
  channel.publications.forEach(subscribeAndAttach);
  channel.onStreamPublished.add((e) => {
    subscribeAndAttach(e.publication);
  });

  channel.onMemberLeft.add((e) => {
    console.log("---------onMemberLeft---------");
    console.log(e.member.id);
    deleteMember(e.member.id);
  });

  function addMember(member, elm) {
    if (isOldMember(member.id)) {
      return;
    }
    elm.innerText += member.name + "が入室しました" + "\n";
    elm.innerText += member.id + "がIDです" + "\n";
    data.write(myMemberData);
    var member = {
      name: member.name,
      id: member.id,
      audioID: member.audioID,
      dataID: member.dataID,
      videoID: member.videoID,
    };
    memberList.push(member);

    console.log(document.getElementsByClassName("js-video-id")[0]);
    Array.from(document.getElementsByClassName("js-video-id")).forEach((e) => {
      console.log(e.value);
      if (e.value == member.videoID) {
        //videoに名前を入れるところ
        const divName = document.createElement("div");
        divName.innerText += member.name;
        e.closest(".js-video-area").appendChild(divName);
      }
    });
  }
  function deleteMember(memberId) {
    // if (!isOldMember(memberId)) {
    //   return;
    // }
    //TODO:退出したときの処理を作成する
    var member = memberList.find((element) => element.id == memberId);
    console.log(member);
    const elm = document.createElement("div");
    remoteTextArea.appendChild(elm);
    elm.innerText += member.name + "が退室しました" + "\n";
    elm.innerText += member.id + "がIDです" + "\n";
  }
  function isOldMember(memberId) {
    var oldMember = memberList.find((element) => element.id == memberId);
    return oldMember != undefined;
  }
})();
