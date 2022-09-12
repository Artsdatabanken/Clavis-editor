import React from "react";
import { Button, Card, CardContent, Alert } from "@mui/material";
import moment from "moment";
import "../App.css";
import { deepClone } from "../Utils";

function Files({ clavis, setClavis }) {

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
  }




  return (
    <div>
      <h1 className="bp4-heading">Import/export files</h1>


      <Card className="formCard" >
        <CardContent>
          <p>To load a key from disk, upload it here.</p>
          <Alert fullWidth severity="warning">Don't forget to export the current key first if you want to save it!</Alert>

          <Button variant="contained" component="label" color="primary">
            Import key
            <input type="file" hidden onChange={uploadKey} />
          </Button>
        </CardContent>
      </Card>

      <Card className="formCard" >
        <CardContent>
          <p>This editor does store your files. To save the current key, download it as a file here so you can share it or continue editing some other time.</p>
          <Button variant="contained" onClick={downloadKey}>Export key</Button>
        </CardContent>
      </Card>


    </div>

  );
}


export default Files;
