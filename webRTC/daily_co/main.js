call = window.Daily.createFrame({
  showLeaveButton: true,
  iframeStyle: {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
  },
});
call.join({ url: API_URL });
