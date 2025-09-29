document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle") as HTMLButtonElement;
  const sideMenu = document.getElementById("sideMenu") as HTMLElement;
  const overlay = document.getElementById("overlay") as HTMLElement;
  const menuItems = sideMenu.querySelectorAll("button[data-path]") as NodeListOf<HTMLButtonElement>;

  let isOpen = false;

  // メニュー開閉処理
  menuToggle.addEventListener("click", () => {
    isOpen = !isOpen;
    sideMenu.classList.toggle("open", isOpen);
    overlay.classList.toggle("hidden", !isOpen); // オーバーレイ表示切り替え
    menuToggle.textContent = isOpen ? "×" : "☰";
  });

  // オーバーレイをクリックしたらメニューを閉じる
  overlay.addEventListener("click", () => {
    isOpen = false;
    sideMenu.classList.remove("open");
    overlay.classList.add("hidden");
    menuToggle.textContent = "☰";
  });

  // メニュー項目クリック時の画面遷移
  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      const path = item.getAttribute("data-path");
      const studentId = localStorage.getItem("studentId");

      const url = path === "/" || !studentId
        ? path!
        : `${path}?studentId=${studentId}`;

      window.location.href = url;
    });
  });
});
