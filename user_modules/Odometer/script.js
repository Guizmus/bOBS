const _e = {
    "odometer": document.getElementById('odometer')
}
const queryParams = new URLSearchParams(window.location.search);
var current_time = 0;
setInterval(function () {
    WebModule.query("update_time", false, function (time) {
        current_time = time;
        led[0].setValue(Math.floor(current_time / 10))
        led[1].setValue(current_time % 10)
    });
}, 5000);

const led = [
    new StudioLed({
        element: document.querySelector("#counter1"),
        width: 85,
        height: 135,
        initialValue: 0,
        baseDigits: 1
    }),
    new StudioLed({
        element: document.querySelector("#counter2"),
        width: 85,
        height: 135,
        initialValue: 0,
        baseDigits: 1
    })
];
led[0].setStatus("error");
led[1].setStatus("error");
led[0].render();
led[1].render();