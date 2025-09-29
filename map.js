document.addEventListener("DOMContentLoaded", function () {
    var menuToggle = document.getElementById("menuToggle");
    var sideMenu = document.getElementById("sideMenu");
    var overlay = document.getElementById("overlay");
    var menuItems = sideMenu.querySelectorAll("button[data-path]");
    var isOpen = false;
    // メニュー開閉処理
    menuToggle.addEventListener("click", function () {
        isOpen = !isOpen;
        sideMenu.classList.toggle("open", isOpen);
        overlay.classList.toggle("hidden", !isOpen); // オーバーレイ表示切り替え
        menuToggle.textContent = isOpen ? "×" : "☰";
    });
    // オーバーレイをクリックしたらメニューを閉じる
    overlay.addEventListener("click", function () {
        isOpen = false;
        sideMenu.classList.remove("open");
        overlay.classList.add("hidden");
        menuToggle.textContent = "☰";
    });
    // メニュー項目クリック時の画面遷移
    menuItems.forEach(function (item) {
        item.addEventListener("click", function () {
            var path = item.getAttribute("data-path");
            var studentId = localStorage.getItem("studentId");
            var url = path === "/" || !studentId
                ? path
                : "".concat(path, "?studentId=").concat(studentId);
            window.location.href = url;
        });
    });
});
