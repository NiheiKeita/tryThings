// var session = OT.initSession(appId, sessionId);
// // create publisher
// var publisher = OT.initPublisher();
// session.connect(token, function (err) {
//   // publish publisher
// });

initializeSession();

function handleError(error) {
  if (error) alert(error.message);
}

function initializeSession() {
  const session = OT.initSession(APP_ID, SESSION_ID);

  //自分
  const publisher = OT.initPublisher(
    "publisher",
    {
      targetElement: "publisher_area",
      width: "60%",
      height: "60%",
    },
    handleError
  );

  //相手
  session.on("streamCreated", function (event) {
    session.subscribe(
      event.stream,
      "subscriber",
      {
        targetElement: "subscriber_area",
        width: "60%",
        height: "60%",
      },
      handleError
    );
  });

  session.on("sessionDisconnected", function sessionDisconnected(event) {
    console.error("You were disconnected from the session.", event.reason);
  });

  session.connect(TOKEN, function (error) {
    error ? handleError(error) : session.publish(publisher, handleError);
  });
}
