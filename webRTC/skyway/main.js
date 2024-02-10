// import {
//   nowInSec,
//   SkyWayAuthToken,
//   SkyWayContext,
//   SkyWayRoom,
//   SkyWayStreamFactory,
//   uuidV4,
// } from "@skyway-sdk/room";

const {
  nowInSec,
  SkyWayAuthToken,
  SkyWayContext,
  SkyWayStreamFactory,
  SkyWayRoom,
  uuidV4,
} = skyway_room;
const ENTER_ROOM_KEY = "enter_room";
const LEAVE_ROOM_KEY = "leave_room";
const SUBMIT_TEXT_KEY = "submit_text";

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
  // const buttonArea = document.getElementById("button-area");
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

  const nameButton = document.getElementById("name_button");
  nameButton.addEventListener(
    "click",
    async function () {
      if (document.getElementById("member_name").value == "") {
        return;
      }
      myMemberData.name = document.getElementById("member_name").value;
      document.getElementById("member_name").disabled = true;
      document.getElementById("name_button").hidden = true;
      const data = await SkyWayStreamFactory.createDataStream();
      writeButton.onclick = () => {
        //TODO:送信ボタンを押したときの処理を作成す
        var submitData = {
          dataTyepe: SUBMIT_TEXT_KEY,
          text: dataStreamInput.value,
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

      await me.publish(video);
      await me.publish(audio);
      await me.publish(data);
      // console.log("subscribeAndAttach");

      const subscribeAndAttach = async (publication) => {
        if (publication.publisher.id === me.id) return;

        // const subscribeButton = document.createElement("button");
        // subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
        // buttonArea.appendChild(subscribeButton);
        const { stream } = await me.subscribe(publication.id);
        // console.log("------------stream-------------");
        // console.log(stream);
        switch (stream.contentType) {
          case "video":
            {
              console.log(stream);
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
              //入ってきた人のAudioを作成する
              const divAudio = document.createElement("div");
              divAudio.setAttribute("class", "js-audio-area");
              const elm = document.createElement("audio");
              const inputAudioID = document.createElement("input");
              inputAudioID.setAttribute("value", stream.id);
              inputAudioID.setAttribute("class", "js-audio-id");
              inputAudioID.setAttribute("type", "hidden");
              elm.controls = true;
              elm.autoplay = true;
              stream.attach(elm);
              divAudio.appendChild(elm);
              divAudio.appendChild(inputAudioID);
              remoteAudioArea.appendChild(divAudio);
            }
            break;
          case "data": {
            //データコネクション
            const elm = document.createElement("div");
            remoteTextArea.appendChild(elm);
            // elm.innerText = "data\n";
            myMemberData.id = me.id;
            myMemberData.audioID = me.id;
            myMemberData.dataID = audio.id;
            myMemberData.videoID = video.id;

            stream.onData.add((receiveData) => {
              //NOTE:きたデータをうけ取る
              if (receiveData.dataTyepe == ENTER_ROOM_KEY) {
                //NOTE:新しく入ってきたメンバーのデータの受け取り
                addMember(receiveData, elm);
              } else if (receiveData.dataTyepe == LEAVE_ROOM_KEY) {
                //NOTE:抜けるメンバーのデータの受け取り
                deleteMember(receiveData.id);
              } else if (receiveData.dataTyepe == SUBMIT_TEXT_KEY) {
                //TODO:チャットを受け取った処理を作成する
                elm.innerText += receiveData.text + "\n";
                createText(receiveData.text);
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
        //メンバーが入室したときの処理
        if (isOldMember(member.id)) {
          return;
        }
        elm.innerText += member.name + "が入室しました" + "\n";
        // elm.innerText += member.id + "がIDです" + "\n";
        data.write(myMemberData);
        var member = {
          name: member.name,
          id: member.id,
          audioID: member.audioID,
          dataID: member.dataID,
          videoID: member.videoID,
        };
        memberList.push(member);

        // console.log(document.getElementsByClassName("js-video-id")[0]);
        //videoに名前を入れる
        Array.from(document.getElementsByClassName("js-video-id")).forEach(
          (e) => {
            console.log(e.value);
            if (e.value == member.videoID) {
              const divName = document.createElement("div");
              divName.innerText += member.name;
              e.closest(".js-video-area").appendChild(divName);
            }
          }
        );
      }
      function deleteMember(memberId) {
        //メンバーが退出したときの処理
        if (!isOldMember(memberId)) {
          return;
        }
        var member = memberList.find((element) => element.id == memberId);
        console.log(member);
        const elm = document.createElement("div");
        remoteTextArea.appendChild(elm);
        elm.innerText += member.name + "が退室しました" + "\n";
        // elm.innerText += member.id + "がIDです" + "\n";

        //ビデオを削除
        Array.from(document.getElementsByClassName("js-video-id")).forEach(
          (e) => {
            console.log(e.value);
            if (e.value == member.videoID) {
              e.closest(".js-video-area").remove();
            }
          }
        );
        //オーディオを削除
        Array.from(document.getElementsByClassName("js-audio-id")).forEach(
          (e) => {
            console.log(e.value);
            if (e.value == member.audioID) {
              e.closest(".js-audio-area").remove();
            }
          }
        );
        //memberListから削除
        memberList.splice(
          memberList.value.findIndex((element) => element.id == memberId),
          1
        );
      }
      function isOldMember(memberId) {
        var oldMember = memberList.find((element) => element.id == memberId);
        return oldMember != undefined;
      }

      //退室ボタンを押したときの処理
      document.getElementById("leave_button").addEventListener(
        "click",
        function () {
          deleteMember(myMemberData.id);
        },
        false
      );
    },
    false
  );
})();

const button01 = document.getElementById("button01");
button01.addEventListener(
  "click",
  function () {
    createText("うんち～～～～～");
  },
  false
);
let count = 0;

async function createText(comment) {
  let div_text = document.createElement("div");
  div_text.id = "text" + count; //アニメーション処理で対象の指定に必要なidを設定
  count++;
  div_text.style.position = "fixed"; //テキストのは位置を絶対位置にするための設定
  div_text.style.whiteSpace = "nowrap"; //画面右端での折り返しがなく、画面外へはみ出すようにする
  div_text.style.left = document.documentElement.clientWidth + "px"; //初期状態の横方向の位置は画面の右端に設定
  var random = Math.round(Math.random(document.documentElement.clientHeight));
  div_text.style.top = random + "px"; //初期状態の縦方向の位置は画面の上端から下端の間に設定（ランダムな配置に）
  div_text.appendChild(document.createTextNode(comment + count)); //画面上に表示されるテキストを設定
  document.body.appendChild(div_text); //body直下へ挿入

  //ライブラリを用いたテキスト移動のアニメーション： durationはアニメーションの時間、
  //        横方向の移動距離は「画面の横幅＋画面を流れるテキストの要素の横幅」、移動中に次の削除処理がされないようawait
  await gsap.to("#" + div_text.id, {
    duration: 5,
    x: -1 * (document.documentElement.clientWidth + div_text.clientWidth),
  });

  div_text.parentNode.removeChild(div_text); //画面上の移動終了後に削除
}
