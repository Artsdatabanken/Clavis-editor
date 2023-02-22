import React, { useState } from "react";
import {
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  FormLabel, Avatar
} from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';

import axios from "axios";
import "../App.css";

function ImageSelector({ callback, scientificNameId, newImage }) {
  const [image, setImage] = useState()
  const [imageSuggestions, setImageSuggestions] = useState(false);
  const [loadingImageSuggestions, setLoadingImageSuggestions] = useState(true);

  const addImage = (add) => {
    callback(newImage(add))
  }

  if (!imageSuggestions && !!scientificNameId) {
    axios
      .get(
        "https://www.artsdatabanken.no/api/Images/species/" +
        scientificNameId
      )
      .then((res) => {
        setImageSuggestions(res.data.data);
        setLoadingImageSuggestions(false)
      });
  }

  return (
    <Dialog open={true}>
      <DialogTitle>Add picture</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Provide and image for this taxon in the form of an url, the ID of a media element at NBIC, or click a suggested image if any were found.
        </DialogContentText>
        <TextField
          autoFocus
          value={image}
          onChange={(e) => { setImage(e.target.value) }}
          margin="dense"
          id="name"
          placeholder="E.g. 'F27858'"
          fullWidth
        />

        {!!imageSuggestions["images"] &&
          <p>
            <FormLabel component="legend">Suggestions</FormLabel>

            <div className="sideBySide suggestions">

              {!!loadingImageSuggestions &&
                <CircularProgress size={25} />
              }

              {imageSuggestions["images"].map(i => {
                return <Avatar
                  sx={{ width: 64, height: 64 }}
                  src={i["url"].replace("file/", "Media/F") + "?mode=128x128"}
                  onClick={() => { addImage("F" + i["url"].split("/").pop()); }} />
              })}
            </div>
          </p>
        }


      </DialogContent>
      <DialogActions>
        <Button onClick={() => { addImage(false) }}>Cancel</Button>
        <Button onClick={() => { addImage(image) }}>{!!image ? "Add" : "No image"}</Button>
      </DialogActions>
    </Dialog>

  );
}


export default ImageSelector;
