import ParaIcon from "./assets/images/para-white-icon-01.svg";
import ParaLogo from "./assets/images/para-logo.svg";
import background from "./assets/images/para-presale-bg.jpg";

// Connect modal
export const connectModalTitle = "Warning";
export const connectModalDesc = `You need a <a target="_blank" href="https://etherscan.io/directory/Wallet" rel="noreferrer">web3-enabler</a> to use this Dapp - If you have problems connecting, refresh the page.`;
export const connectModalHideRefresh = false;
export const connectModalButtonText = ""; // Overwrite the metamask text, keep this empty if you don't want to change it

// Contract
export const customContractAddress = "0x129a261afAAe9Fc9AB9D5107e840560d052Cd97E";
export const comingSoon = false; // If you turn this on, this will show the coming soon state

// Colors
export const buttonBackground = "linear-gradient(150deg, #A8096D 0%, #A8096D 0%, #540537 100%) 0% 0% no-repeat";
export const chartCaretColor = "#912f73";
export const chartCircleColor = "#876384";
export const chipMainColor = "#A8096D";

// Block Content
export const customIcon = ParaIcon;
export const customBlockBackgroundColor = "hsla(0deg, 0%, 100%, 0.12)";
export const customBlockIconBackgroundColor = "#575366";
export const addBlurToCustomBlock = true;

// General background image
export const customBackgroundImage = background;

// Navbar
export const customNavLogo = ParaLogo;
export const customNavLogoAlt = "Para";
export const customNavItems = [
  {
    text: "Website",
    url: "http://paracell.io/",
  },
  {
    text: "Presale",
    url: "https://presale.paracell.io/",
  },
  {
    text: "Telegram",
    url: "https://t.me/paracell_announcements",
    showMobile: true,
  },
  {
    text: "Instagram",
    url: "https://www.instagram.com/paracell.io/",
    showMobile: true,
  },
  {
    text: "Twitter",
    url: "https://twitter.com/paracell_io",
    showMobile: true,
  },
  {
    text: "Linktree",
    url: "https://linktr.ee/paracell.io",
    showMobile: true,
  },
  {
    text: "Discord",
    url: "https://discord.gg/5Ux5fUY75Y",
    showMobile: true,
  },
  {
    text: "Youtube",
    url: "https://www.youtube.com/channel/UC70eME2wzg_Vka1B6GG6Ulg",
    showMobile: true,
  },
];

// Don't touch
function constructor() {
  const outerWrapper = document.getElementById("outer-wrapper");
  if (outerWrapper) {
    outerWrapper.style.backgroundImage = `url(${customBackgroundImage})`;
  }

  document.documentElement.style.setProperty("--main-gradient", buttonBackground);
  document.documentElement.style.setProperty("--caret-color", chartCaretColor);
  document.documentElement.style.setProperty("--chart-circle-color", chartCircleColor);
  document.documentElement.style.setProperty("--main-color", chipMainColor);
}
constructor();
