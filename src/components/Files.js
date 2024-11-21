import React, { useState } from "react";
import { Button, Card, CardContent, Alert } from "@mui/material";
import moment from "moment";
import "../App.css";
import { cleanClavis, deepClone } from "../Utils";
import { useNavigate } from "react-router-dom";
import { flattenTaxa } from "../Utils";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import csv from "csvtojson";

function Files({ clavis, setClavis }) {
  const [isPrepared, setIsPrepared] = useState(false);

  const navigate = useNavigate();

  const convertToCsv = () => {
    let export_clavis = deepClone(clavis);

    // First, get all the taxa as an array. As clavis is hierarchical, every taxon will be an array of its ancestry ending with the taxon itself.
    let taxa = flattenTaxa(export_clavis["taxa"], "", true);
    let characters = export_clavis["characters"];
    let statements = export_clavis["statements"];

    let csv = "Key name,";

    if (export_clavis["title"]) {
      csv += export_clavis["title"][export_clavis["language"][0]];
    }

    csv += ",,,,,,Name";

    for (let i = 0; i < taxa.length; i++) {
      csv += "," + taxa[i]["scientificName"];
    }
    csv += "\n";

    csv += "Key intro,";

    if (export_clavis["description"]) {
      csv +=
        '"' + export_clavis["description"][export_clavis["language"][0]] + '"';
    }

    csv += ",,,,,,ScientificNameID";

    for (let i = 0; i < taxa.length; i++) {
      csv += ",";
      if (taxa[i]["externalReference"]) {
        csv += taxa[i]["externalReference"]["externalId"];
      }
    }
    csv += "\n";

    csv += "Key description,";

    if (export_clavis["descriptionUrl"]) {
      if (export_clavis["descriptionUrl"][export_clavis["language"][0]]) {
        csv +=
          export_clavis["descriptionUrl"][export_clavis["language"][0]][
            "externalId"
          ];
      }
    }

    csv += ",,,,,,Media";

    for (let i = 0; i < taxa.length; i++) {
      csv += ",";
      if (taxa[i]["media"]) {
        csv += taxa[i]["media"].replace("media:f", "F");
      }
    }
    csv += "\n";

    csv += "Language,";
    csv += export_clavis["language"][0];

    csv += ",,,,,,Description";

    for (let i = 0; i < taxa.length; i++) {
      csv += ",";
      if (taxa[i]["descriptionUrl"]) {
        csv +=
          taxa[i]["descriptionUrl"][export_clavis["language"][0]]["externalId"];
      }
    }
    csv += "\n";

    csv += "Geographic range,";
    if (export_clavis["geography"]) {
      csv +=
        '"' +
        export_clavis["geography"]["name"][export_clavis["language"][0]] +
        '"';
    }

    csv += ",,,,,,Morph";

    for (let i = 0; i < taxa.length; i++) {
      csv += ",";
      if (taxa[i]["label"]) {
        csv += taxa[i]["label"][export_clavis["language"][0]];
      }
    }
    csv += "\n";

    csv +=
      "Character,State,Description,State media,State id,Character requirement,Sort";
    for (let i = 0; i < taxa.length; i++) {
      csv += ",";
    }
    csv += "\n";

    let rowcount = 0;

    for (let i = 0; i < characters.length; i++) {
      let character = characters[i];
      let states = character["states"];
      let state = states[0];

      csv += '"' + character["title"][export_clavis["language"][0]] + '",';
      csv += '"' + state["title"][export_clavis["language"][0]] + '",';

      if (character["descriptionUrl"]) {
        csv += character["descriptionUrl"][export_clavis["language"][0]];
      }
      csv += ",";
      if (state["media"]) {
        csv += state["media"].replace("media:", "");
      }
      csv += ",,,";

      csv += ++rowcount + ",";

      for (let j = 0; j < taxa.length; j++) {
        csv += ",";

        let statement = statements.find((s) => {
          return (
            s["value"] === state["id"] &&
            taxa[j]["ancestry"].find((a) => {
              return a === s["taxon"];
            })
          );
        });

        if (statement) {
          csv += statement["frequency"];
        }
      }

      csv += "\n";

      for (let j = 1; j < states.length; j++) {
        let state = states[j];
        csv += ',"' + state["title"][export_clavis["language"][0]] + '",,';

        if (state["media"]) {
          csv += state["media"].replace("media:", "");
        }
        csv += ",,,";
        csv += ++rowcount + ",";

        for (let j = 0; j < taxa.length; j++) {
          csv += ",";

          let statement = statements.find((s) => {
            return (
              s["value"] === state["id"] &&
              taxa[j]["ancestry"].find((a) => {
                return a === s["taxon"];
              })
            );
          });

          if (statement) {
            csv += statement["frequency"];
          }
        }

        csv += "\n";
      }
    }

    var BOM = "\uFEFF";

    var dataStr =
      "data:text/csv;charset=utf-8," + BOM + encodeURIComponent(csv);
    var downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      "Clavis key " + export_clavis["identifier"] + ".csv"
    );
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadKey = () => {
    let export_file = deepClone(clavis);
    let now = moment().format("YYYY-MM-DD HH:mm:ss");
    export_file["lastModified"] = now;

    var dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(export_file, null, 2));
    var downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      "Clavis key " +
        export_file["identifier"] +
        " (" +
        now.replaceAll(":", "_") +
        ").json"
    );
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- Getting the date as a nice Norwegian-time string no matter where the server runs
  const dateStr = (date = false) => {
    if (!date) {
      date = new Date();
    }

    // return a date string in yyyy-mm-dd hh:mm:ss format
    return date.toISOString().substring(0, 19).replace("T", " ");
  };
  const getNewJson = (language, license) => {
    let json = {};
    json.$schema =
      "https://github.com/Artsdatabanken/Clavis/releases/download/v1.0/Clavis.json";
    json.identifier = uuidv4();
    json.lastModified = dateStr();
    json.language = [language];
    json.license = license;
    json.externalServices = [
      {
        id: "service:nbic_taxa",
        title: "NBIC taxonomy scientificNameId",
        description:
          "To retrieve taxon information based on the NBIC scientificNameId, e.g. through https://www.artsdatabanken.no/api/Taxon/ByScientificNameId/4362",
        provider: "Norwegian Biodiversity Information Centre",
        url: "https://www.artsdatabanken.no/help",
      },
      {
        id: "service:nbic_page",
        title: "NBIC page ID",
        description:
          "To retrieve a page from NBIC by its ID, e.g. through https://www.artsdatabanken.no/Pages/237010",
        provider: "Norwegian Biodiversity Information Centre",
        url: "https://www.artsdatabanken.no/help",
      },
      {
        id: "service:nbic_media",
        title: "NBIC media ID",
        description:
          "To retrieve a picture from NBIC by its ID, e.g. through https://www.artsdatabanken.no/Media/F27858?mode=750x750",
        provider: "Norwegian Biodiversity Information Centre",
        url: "https://www.artsdatabanken.no/help",
      },
    ];

    json.mediaElements = [];
    json.statements = [];

    return json;
  };

  const findHeaderIndexHorizontal = (csvArray) => {
    let headerIndexHorizontal = 0;

    for (; headerIndexHorizontal < csvArray.length; headerIndexHorizontal++) {
      if (csvArray[headerIndexHorizontal][0] === "Character") {
        break;
      }
    }

    return headerIndexHorizontal;
  };

  const findHeaderIndexVertical = (csvArray) => {
    let headerIndexVertical = csvArray[0].findIndex((col) => col === "");

    for (; headerIndexVertical < csvArray[0].length; headerIndexVertical++) {
      if (csvArray[0][headerIndexVertical] !== "") {
        break;
      }
    }

    return headerIndexVertical;
  };

  const getMetadataString = (csvArray, fieldName, language) => {
    const fieldRow = csvArray.find((row) => row[0] === fieldName);

    if (fieldRow && fieldRow[1]) {
      let languageObject = {};
      languageObject[language] = fieldRow[1];
      return languageObject;
    }

    return undefined;
  };

  const getMetadataUrl = (csvArray, fieldName, language) => {
    const fieldRow = csvArray.find((row) => row[0] === fieldName);

    if (!!fieldRow && !!fieldRow[1]) {
      let fieldObject = {};
      fieldObject[language] = {
        externalReference: {
          serviceId: "service:nbic_page",
          externalId: fieldRow[1],
        },
      };

      return fieldObject;
    }

    return undefined;
  };

  const getCharacters = (csvArray, headerIndexHorizontal, language) => {
    let characters = [];

    const characterColumn = csvArray[headerIndexHorizontal].findIndex(
      (cell) => cell === "Character"
    );

    const stateColumn = csvArray[headerIndexHorizontal].findIndex(
      (cell) => cell === "State"
    );
    // const stateIdColumn = csvArray[headerIndexHorizontal].findIndex(
    //   (cell) => cell === "State id"
    // );

    // const characterSortColumn = csvArray[headerIndexHorizontal].findIndex(
    //   (cell) => cell === "Sort"
    // );

    // const characterRequirementColumn = csvArray[
    //   headerIndexHorizontal
    // ].findIndex((cell) => cell === "Character requirement");

    const stateMediaColumn = csvArray[headerIndexHorizontal].findIndex(
      (cell) => cell === "State media"
    );

    for (
      let rowIndex = headerIndexHorizontal + 1;
      rowIndex < csvArray.length;
      rowIndex++
    ) {
      if (csvArray[rowIndex][characterColumn]) {
        let character = {
          id: "character:" + uuidv4().replaceAll("-", ""),
          title: {},
        };
        character.title[language] = csvArray[rowIndex][characterColumn];
        character.index = rowIndex;
        character.states = [];
        characters.push(character);
      }

      let state = {
        id: "state:" + uuidv4().replaceAll("-", ""),
        title: {},
      };
      state.title[language] = csvArray[rowIndex][stateColumn];
      state.index = rowIndex;
      if (csvArray[rowIndex][stateMediaColumn]) {
        state.media =
          "media:" + csvArray[rowIndex][stateMediaColumn].toLowerCase();
      }
      characters[characters.length - 1].states.push(state);
    }

    return characters;
  };

  const getTaxa = async (csvArray, headerIndexVertical, language) => {
    let taxa = [];

    const taxonRow = csvArray.findIndex(
      (row) => row[headerIndexVertical] === "Taxon"
    );

    const scientificNameIdRow = csvArray.findIndex(
      (row) => row[headerIndexVertical] === "ScientificNameID"
    );

    const morphRow = csvArray.findIndex(
      (row) => row[headerIndexVertical] === "Morph"
    );

    // const descriptionRow = csvArray.findIndex(
    //   (row) => row[headerIndexVertical] === "Description"
    // );

    const mediaRow = csvArray.findIndex(
      (row) => row[headerIndexVertical] === "Media"
    );

    // const sortRow = csvArray.findIndex(
    //   (row) => row[headerIndexVertical] === "Sort"
    // );

    // const nameRow = csvArray.findIndex(
    //   (row) => row[headerIndexVertical] === "Name"
    // );

    for (
      let columnIndex = headerIndexVertical + 1;
      columnIndex < csvArray[0].length;
      columnIndex++
    ) {
      let taxon = {
        id: "taxon:" + uuidv4().replaceAll("-", ""),
      };

      let scientificNameId;
      if (taxonRow > -1 && scientificNameIdRow === -1) {
        let url = encodeURI(
          `https://artsdatabanken.no/api/Resource/Taxon/${csvArray[taxonRow][columnIndex]}`
        );

        // get the taxon info from the taxonId cached file, if it exists
        let taxonIdInfo;

        taxonIdInfo = await axios
          .get(url, {
            timeout: 6000,
          })
          .catch((error) => {
            console.log("TaxonId lookup failed");
            console.log(
              encodeURI(
                `https://artsdatabanken.no/api/Resource/Taxon/${csvArray[taxonRow][columnIndex]}`
              )
            );
          });

        // save the taxonId info to the cache
        // fs.writeFileSync(
        //   `./cache/taxonId/${csvArray[taxonRow][columnIndex]}.json`,
        //   JSON.stringify(taxonIdInfo.data)
        // );

        scientificNameId = taxonIdInfo.data.AcceptedNameUsage.ScientificNameId;
      } else if (scientificNameIdRow > -1) {
        scientificNameId = csvArray[scientificNameIdRow][columnIndex];
      }

      if (scientificNameId) {
        taxon.externalReference = {
          serviceId: "service:nbic_taxa",
          externalId: scientificNameId,
        };

        let taxonInfo;
        // get the taxon info from the scientificNameId cached file, if it exists

        taxonInfo = await axios
          .get(
            `https://artsdatabanken.no/api/Resource/ScientificName/${scientificNameId}`,
            {
              timeout: 6000,
            }
          )
          .catch((error) => {
            console.log("scientificNameId lookup failed");
          });

        // save the taxonInfo to the cache
        // fs.writeFileSync(
        //   `./cache/scientificNameId/${scientificNameId}.json`,
        //   JSON.stringify(taxonInfo.data)
        // );

        if (taxonInfo.data.ScientificName) {
          taxon.scientificName = taxonInfo.data.ScientificName;
        }

        if (morphRow > -1 && csvArray[morphRow][columnIndex]) {
          taxon.morph = csvArray[morphRow][columnIndex];
        }

        if (
          language === "nb" &&
          taxonInfo.data.Taxon &&
          taxonInfo.data.Taxon["VernacularName_nb-NO"]
        ) {
          taxon.vernacularName = {
            nb: taxonInfo.data.Taxon["VernacularName_nb-NO"],
          };
        } else if (
          language === "nn" &&
          taxonInfo.data.Taxon &&
          taxonInfo.data.Taxon["VernacularName_nn-NO"]
        ) {
          taxon.vernacularName = {
            nn: taxonInfo.data.Taxon["VernacularName_nn-NO"],
          };
        }
      }

      if (mediaRow > -1 && csvArray[mediaRow][columnIndex]) {
        taxon.media = "media:" + csvArray[mediaRow][columnIndex].toLowerCase();
      }
      taxon.index = columnIndex;

      taxa.push(taxon);
    }

    return taxa;
  };

  const createMediaElement = (id) => {
    return {
      id: id,
      mediaElement: {
        file: {
          url: {
            serviceId: "service:nbic_media",
            externalId: id.replace("media:", "").toUpperCase(),
          },
        },
      },
    };
  };

  const getMediaElements = (mediaElements, objectArray) => {
    for (let objectIndex = 0; objectIndex < objectArray.length; objectIndex++) {
      if (objectArray[objectIndex].media) {
        mediaElements.push(createMediaElement(objectArray[objectIndex].media));
      }

      if (objectArray[objectIndex].states) {
        for (
          let stateIndex = 0;
          stateIndex < objectArray[objectIndex].states.length;
          stateIndex++
        ) {
          if (objectArray[objectIndex].states[stateIndex].media) {
            mediaElements.push(
              createMediaElement(
                objectArray[objectIndex].states[stateIndex].media
              )
            );
          }
        }
      }
    }

    return [...new Set(mediaElements)];
  };

  const getStatements = (csvArray, characters, taxa) => {
    let statements = [];

    for (
      let characterIndex = 0;
      characterIndex < characters.length;
      characterIndex++
    ) {
      let character = characters[characterIndex];

      for (
        let stateIndex = 0;
        stateIndex < character.states.length;
        stateIndex++
      ) {
        let state = character.states[stateIndex];
        for (let taxonIndex = 0; taxonIndex < taxa.length; taxonIndex++) {
          let taxon = taxa[taxonIndex];
          let frequency = csvArray[state["index"]][taxon["index"]];

          if (frequency === "") {
            continue;
          }

          let statement = {
            id: "statement:" + uuidv4().replaceAll("-", ""),
            character: characters[characterIndex].id,
            value: characters[characterIndex].states[stateIndex].id,
            taxon: taxa[taxonIndex].id,
            frequency: Number(frequency.replace(",", ".")),
          };
          statements.push(statement);
        }
      }
    }

    return statements;
  };

  const arrangeTaxa = (taxa, language) => {
    let arrangedTaxa = [];

    for (let taxonIndex = 0; taxonIndex < taxa.length; taxonIndex++) {
      let taxon = taxa[taxonIndex];
      if (taxon.morph === undefined) {
        arrangedTaxa.push(taxon);
        continue;
      }

      // find the index of the parent taxon in the arrangedTaxa array
      let parentIndex = arrangedTaxa.findIndex(
        (arrangedTaxon) => arrangedTaxon.scientificName === taxon.scientificName
      );

      // if there is no parent, make a new one
      if (parentIndex === -1) {
        let parent = JSON.parse(JSON.stringify(taxon));
        delete parent.morph;
        parent.children = [];
        parent.id = "taxon:" + uuidv4().replaceAll("-", "");
        parent.isEndPoint = true;
        arrangedTaxa.push(parent);
        parentIndex = arrangedTaxa.length - 1;
      }

      let label = {};
      label[language] = taxon.morph;

      arrangedTaxa[parentIndex].children.push({
        id: taxon.id,
        label: label,
      });
    }

    return arrangedTaxa;
  };

  const checkHierarchy = (statements, taxa, characters) => {
    for (let taxonIndex = 0; taxonIndex < taxa.length; taxonIndex++) {
      let taxon = taxa[taxonIndex];

      for (
        let characterIndex = 0;
        characterIndex < characters.length;
        characterIndex++
      ) {
        let character = characters[characterIndex];

        let moveToParent = true;
        if (taxon.children && taxon.children.length) {
          let relevantStatements = statements.filter(
            (statement) =>
              statement.character === character.id &&
              taxon.children.map((child) => child.id).includes(statement.taxon)
          );

          if (!relevantStatements.length) {
            continue;
          }

          for (
            let relevantStatementIndex = 0;
            relevantStatementIndex < relevantStatements.length;
            relevantStatementIndex++
          ) {
            let relevantStatement = relevantStatements[relevantStatementIndex];
            if (
              relevantStatements.find(
                (statement) =>
                  statement.value === relevantStatement.value &&
                  statement.frequency !== relevantStatement.frequency
              )
            ) {
              moveToParent = false;
              break;
            }
          }
        }

        if (moveToParent && taxon.children) {
          let newStatements = statements.filter(
            (statement) =>
              statement.character === character.id &&
              statement.taxon === taxon.children[0].id
          );

          newStatements = newStatements.map((statement) => {
            statement.taxon = taxon.id;
            return statement;
          });

          statements = statements.filter(
            (statement) =>
              !(
                statement.character === character.id &&
                taxon.children
                  .map((child) => child.id)
                  .includes(statement.taxon)
              )
          );

          statements = statements.concat(newStatements);
        }
      }
    }

    return statements;
  };

  const cleanUp = (items) => {
    const removeIndex = (item) => {
      delete item.index;
      return item;
    };

    for (let i = 0; i < items.length; i++) {
      items[i] = removeIndex(items[i]);
      if (items[i].children) {
        items[i].children = cleanUp(items[i].children);
      }
      if (items[i].states) {
        items[i].states = cleanUp(items[i].states);
      }
    }

    return items;
  };

  const csvToJson = async (csvArray, language, license) => {
    let json = getNewJson(language, license);

    json["title"] = getMetadataString(csvArray, "Key name", language);

    let geography = getMetadataString(csvArray, "Geographic range", language);
    if (geography) {
      json["geography"] = { name: geography };
    }

    json["description"] = getMetadataString(csvArray, "Key intro", language);

    json["descriptionUrl"] = getMetadataUrl(
      csvArray,
      "Key description",
      language
    );

    const headerIndexHorizontal = findHeaderIndexHorizontal(csvArray);
    const headerIndexVertical = findHeaderIndexVertical(csvArray);

    json["characters"] = getCharacters(
      csvArray,
      headerIndexHorizontal,
      language
    );
    json["taxa"] = await getTaxa(csvArray, headerIndexVertical, language);

    json["statements"] = getStatements(
      csvArray,
      json["characters"],
      json["taxa"]
    );

    json["mediaElements"] = getMediaElements(
      json["mediaElements"],
      json["characters"]
    );

    json["mediaElements"] = getMediaElements(
      json["mediaElements"],
      json["taxa"]
    );
    json["taxa"] = arrangeTaxa(json["taxa"], language);

    json["statements"] = checkHierarchy(
      json["statements"],
      json["taxa"],
      json["characters"]
    );

    json["taxa"] = cleanUp(json["taxa"]);
    json["characters"] = cleanUp(json["characters"]);

    return json;
  };

  const onReaderLoad = (e) => {
    if (e.target.result[0] === "{") {
      var obj = JSON.parse(e.target.result);
      setClavis(obj);
    } else {
      try {
        csv({
          noheader: true,
          output: "csv",
          delimiter: "auto",
        })
          .fromString(e.target.result)
          .then((csvArray) => {
            csvToJson(
              csvArray,
              clavis.language[0] || "nb",
              clavis.license || "https://creativecommons.org/licenses/by/4.0/"
            ).then((json) => {
              setClavis(json);
            });
          });

        // setClavis(json);
      } catch (error) {}

      alert(
        "This is not a Clavis key file. If it is a csv file, it will be converted to a Clavis key, but this will take some seconds. Please be patient."
      );
    }
  };

  const uploadKey = (e) => {
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(e.target.files[0]);
    navigate("/");
  };

  const prepareKey = () => {
    clavis = cleanClavis(clavis);

    setIsPrepared(true);
  };

  return (
    <div>
      <h1 className="bp4-heading">Import/export files</h1>

      <Card className="formCard">
        <CardContent>
          <p>To load a key from disk, upload it here.</p>

          <Alert severity="warning">
            Don't forget to save the current key to your local disk first if you
            want to keep it!
          </Alert>

          <Button variant="contained" component="label" color="primary">
            Load key
            <input type="file" hidden onChange={uploadKey} />
          </Button>
        </CardContent>
      </Card>

      <Card className="formCard">
        <CardContent>
          <p>
            This editor does NOT store any identification keys. To save the
            current key, download it to your local drive here so you can share
            it or continue editing some other time. Prior to downloading, it
            needs to be prepared for export.
          </p>

          {!isPrepared && (
            <Button variant="contained" onClick={prepareKey}>
              Prepare key
            </Button>
          )}

          {!!isPrepared && (
            <Button variant="contained" onClick={downloadKey}>
              Download clavis key
            </Button>
          )}
        </CardContent>
      </Card>

      {!!isPrepared && (
        <Card className="formCard">
          <CardContent>
            <p>
              Note: the legacy csv format does not support all features of the
              Clavis key format so some information may be lost.
            </p>
            <Button variant="contained" onClick={convertToCsv}>
              Download as legacy csv
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Files;
