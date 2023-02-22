// capitalize a string
export const capitalize = (str) => {
  if (!str || typeof str !== "string") {
    return false
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getImgSrc = (mediaElement, width, height) => {
  if (mediaElement["file"]["url"]["externalId"]) {
    return "https://www.artsdatabanken.no/Media/" + mediaElement["file"]["url"]["externalId"] + "?mode=" + parseInt(width) + "x" + parseInt(height)
  }
  else if (mediaElement["file"]["url"].includes("/")) {
    return mediaElement["file"]["url"]
  }
  return ""
}