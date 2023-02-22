import React from "react";
import { Button, Card, CardContent, Alert } from "@mui/material";
import moment from "moment";
import "../App.css";
import { deepClone } from "../Utils";
import { useNavigate } from 'react-router-dom';

function Files({ clavis, setClavis }) {

  const navigate = useNavigate();

  const downloadKey = () => {
    let export_file = deepClone(clavis);
    let now = moment().format('YYYY-MM-DD HH:mm:ss')
    export_file["lastModified"] = now

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(export_file, null, 2));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "Clavis key " + export_file["identifier"] + " (" + now.replaceAll(":", "_") + ").json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  const onReaderLoad = (e) => {
    var obj = JSON.parse(e.target.result);
    setClavis(obj);
  }


  const uploadKey = (e) => {
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(e.target.files[0]);
    navigate("/")
  }




  return (
    <div>
      <h1 className="bp4-heading">Import/export files</h1>


      <Card className="formCard" >
        <CardContent>
          <p>To load a key from disk, upload it here.</p>

          <Alert fullWidth severity="warning">Don't forget to save the current key to your local disk first if you want to keep it!</Alert>

          <Button variant="contained" component="label" color="primary">
            Load key
            <input type="file" hidden onChange={uploadKey} />
          </Button>
        </CardContent>
      </Card>

      <Card className="formCard" >
        <CardContent>
          <p>This editor does NOT store any identification keys. To save the current key, download it to your local drive here so you can share it or continue editing some other time.</p>
          <Button variant="contained" onClick={downloadKey}>Save key</Button>
        </CardContent>
      </Card>


    </div>

  );
}


export default Files;
