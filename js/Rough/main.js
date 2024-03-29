const rc = rough.canvas(document.getElementById("canvas"));
rc.path("M400 100 h 90 v 90 h -90z", {
  stroke: "red",
  strokeWidth: "3",
  fill: "rgba(0,0,255,0.2)",
  fillStyle: "solid",
});
rc.path("M400 250 h 90 v 90 h -90z", {
  fill: "rgba(0,0,255,0.6)",
});
rc.path("M37,17v15H14V17z M50,5H5v50h45z", {
  stroke: "red",
  strokeWidth: "1",
  fill: "blue",
  combineNestedSvgPaths: true,
});
rc.path("M80 80 A 45 45, 0, 0, 0, 125 125 L 125 80 Z", { fill: "green" });
rc.path("M230 80 A 45 45, 0, 1, 0, 275 125 L 275 80 Z", {
  fill: "purple",
  hachureAngle: 60,
  hachureGap: 5,
});
rc.path("M80 230 A 45 45, 0, 0, 1, 125 275 L 125 230 Z", { fill: "red" });
rc.path("M230 230 A 45 45, 0, 1, 1, 275 275 L 275 230 Z", {
  fill: "blue",
});
rc.circle(80, 120, 50); // centerX, centerY, diameter
rc.ellipse(300, 100, 150, 80); // centerX, centerY, width, height
rc.line(80, 120, 300, 100); // x1, y1, x2, y2
