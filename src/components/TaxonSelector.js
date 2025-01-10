import React, { useState } from "react";
import {
  TextField, Button, MenuItem, ListItemText, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Card, CardContent,
  MenuList, FormControl, FormLabel, Select, FormHelperText
} from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';

import { v4 as uuidv4 } from 'uuid';
import { deepClone, flattenTaxa, getBestString, getMultipleLanguageInputs, taxonNames } from "../Utils"

import axios from "axios";
import "../App.css";

function TaxonSelector({ taxa, addTaxon, languages, addingSubtaxon, setAddingSubtaxon }) {
  const emptyTaxon = { "id": "taxon:" + uuidv4().replaceAll("-", "") }

  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [newTaxon, setNewTaxon] = useState(emptyTaxon);
  const [selectedParent, setSelectedParent] = useState(undefined);
  const [selectedLevel, setSelectedLevel] = useState();
  const [importSubtaxaLevel, setImportSubtaxaLevel] = useState(false);
  const [loadingTaxa, setLoadingTaxa] = useState(0);



  if (selectedParent === undefined && !!addingSubtaxon && addingSubtaxon !== "root") {
    setSelectedParent(addingSubtaxon)
  }

  const getChildren = async (levels, id) => {
    let children = []
    setLoadingTaxa(loadingTaxa + 1)


    let res = await axios.get("https://www.artsdatabanken.no/api/Taxon/ScientificName?higherClassificationID=" + id + "&taxonRank=" + levels[0])
    let data = res.data.filter(t => t.taxonomicStatus === "accepted")

    for (let c = 0; c < data.length; c++) {
      let child = data[c];
      let taxon = { "id": "taxon:" + uuidv4().replaceAll("-", "") }

      child = await fillTaxon(taxon, child)
      if (levels.length > 1) {
        child.children = await getChildren(levels.slice(1), child.externalReference.externalId)
      }
      children.push(child)
    }
    setLoadingTaxa(loadingTaxa - 1)
    return children
  }


  const submitTaxon = async () => {
    let submitting = deepClone(newTaxon)
    if (!!importSubtaxaLevel) {
      let relevantLevels = taxonNames.slice(taxonNames.findIndex(x => x === selectedLevel) + 1, taxonNames.findIndex(x => x === importSubtaxaLevel) + 1)
      submitting.children = await getChildren(relevantLevels, submitting.externalReference.externalId)
    }

    addTaxon(submitting, selectedParent)
    setNewTaxon(emptyTaxon)
    setInputValue("");
    setSuggestions([]);
    setSelectedParent(false);
    setAddingSubtaxon(false);

  }


  const fillTaxon = async (taxon, v) => {
    let popular
    if (v.PopularNames) {
      popular = JSON.parse(v.PopularNames)
    }
    else if (v["taxonID"]) {
      popular = await axios.get("https://www.artsdatabanken.no/api/Taxon/" + v.taxonID)
      popular = popular.data.vernacularNames.filter(x => x.nomenclaturalStatus === "preferred")
    }

    taxon["scientificName"] = v["ScientificName"] || v["scientificName"]
    taxon["externalReference"] = {
      "serviceId": "service:nbic_taxa",
      "externalId": (v["ScientificNameId"] || v["scientificNameID"]).toString()
    }

    if (popular) {
      taxon["vernacularName"] = {}
      popular.forEach(popname => {
        if (popname.Lang === "nb-NO") {
          taxon.vernacularName.nb = popname.Name
        }
        else if (popname.Lang === "nn-NO") {
          taxon.vernacularName.nn = popname.Name
        }
        else if (popname.language === "nb-NO") {
          taxon.vernacularName.nb = popname.vernacularName
        }
        else if (popname.language === "nn-NO") {
          taxon.vernacularName.nn = popname.vernacularName
        }
      })
    }
    return taxon
  }

  const writeValue = async (e) => {
    setInputValue(e.target.value);







    if (e.target.value.length > 2) {
      let sci = await axios.get("https://artsdatabanken.no/api/Taxon/ScientificName?scientificName=" + e.target.value)
      let artskart = await axios.get("https://artskart.artsdatabanken.no/appapi/api/data/SearchTaxons?maxCount=5&name=" + e.target.value)

      // Replace the ones from the main API with the ones from Artskart if duplicated, as Artskart provides vernacular names
      // Then remove the duplicates
      // Using the fact that the main API writes scientificName while Artskart writes ScientificName

      let result = [...sci.data, ...artskart.data]

      setSuggestions([...new Set(result.map(s => {
        if (!!s.scientificName) {
          return result.find(x => x.ScientificName === s.scientificName) || s
        }
        return s
      }))])

    } else {
      setSuggestions([]);
    }
    setNewTaxon(emptyTaxon)
  };

  const fillValue = (value) => {
    setInputValue(value.ScientificName);
    setSuggestions([]);
    selectTaxon(value);
  };

  const setTaxon = (field, taxon, l, value) => {
    taxon = deepClone(taxon)

    if (!(field in taxon)) {
      taxon[field] = {}
    }
    taxon[field][l] = value
    setNewTaxon(taxon)
  }


  const selectTaxon = async (v) => {

    let taxon = newTaxon

    axios
      .get(
        "https://www.artsdatabanken.no/api/Taxon/ScientificName/" +
        (v.scientificNameID || v.ScientificNameId)
      )
      .then((res) => {
        setSelectedLevel(res.data.taxonRank);
      });

    taxon = await fillTaxon(taxon, v)
    setNewTaxon(taxon)
  }

  const suggestionItems = [];

  for (const p in [0, 1, 2, 3, 4]) {
    let taxonName;

    if (suggestions.length > p) {
      if (!!suggestions[p].PopularName) {
        taxonName =
          suggestions[p].PopularName +
          " (" +
          suggestions[p].ScientificName +
          ")";
      } else {
        taxonName = suggestions[p].ScientificName || suggestions[p].scientificName;
      }


      suggestionItems.push(
        <MenuItem key={"pred_" + p} onClick={() => fillValue(suggestions[p])}>
          <ListItemText> {taxonName}</ListItemText>
        </MenuItem>
      );
    }
  }

  const selectParent = (e) => {
    setSelectedParent(e.target.value)
  }

  return (
    <div>
      {/* <Fab color="primary" aria-label="add character" onClick={() => { setAdding(true) }}>        <AddIcon />      </Fab> */}

      <Dialog open={addingSubtaxon} onClose={() => { setAddingSubtaxon(false) }}>
        <DialogTitle>Add taxon</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Find or define a taxon.
          </DialogContentText>
          <Card>
            <CardContent>
              <FormControl component="fieldset" variant="outlined" fullWidth>
                <FormLabel component="legend">Add taxon</FormLabel>
                <TextField
                  sx={{ m: 0, marginY: "5px" }}
                  fullWidth
                  key={"taxon-query"}
                  id={"taxon-query"}
                  placeholder="Start typing scientific or Norwegian name to import"
                  onChange={writeValue}
                  value={inputValue} />

                {suggestions.length > 0 &&
                  <Paper fullWidth sx={{ m: 0, marginBottom: "10px" }}

                  >
                    <MenuList dense>
                      {suggestionItems}
                    </MenuList>
                  </Paper>
                }
                <FormHelperText>Look up a taxon at NBIC, or leave emtpy and provide a non-taxonomic level below, such as "Male" or "Larva".</FormHelperText>

                <FormLabel component="legend">Label</FormLabel>

                {getMultipleLanguageInputs({
                  item: newTaxon,
                  field: "label",
                  placeholder: "Or make a label instead, e.g. 'Male' or 'Larva'",
                  languages: languages,
                  required: false,
                  handleChange: setTaxon,
                })}



                {
                  !!taxa.length &&
                  <p>
                    <FormLabel component="legend">Parent</FormLabel>

                    <Select
                      fullWidth
                      sx={{ m: 0, marginY: "5px" }}
                      id="taxon-parent"
                      value={selectedParent}
                      onChange={selectParent}
                    >
                      <MenuItem value={false}>None</MenuItem>
                      {flattenTaxa(taxa).map(taxon => <MenuItem value={taxon["id"]}>
                        {taxon["level"]}
                        {taxon["scientificName"]}
                        {!!taxon["label"] && getBestString(taxon["label"], languages)}
                      </MenuItem>)}
                    </Select>
                    <FormHelperText>Select a taxon that this one is to be a subunit of.</FormHelperText>
                  </p>
                }

                {
                  !!newTaxon.externalReference && !!newTaxon.externalReference.externalId &&
                  <p>
                    <FormLabel component="legend">Also import all subtaxa up to the level of:</FormLabel>

                    <Select
                      fullWidth
                      sx={{ m: 0, marginY: "5px" }}
                      id="import-level"
                      onChange={(e) => setImportSubtaxaLevel(e.target.value)}
                      value={importSubtaxaLevel}
                    >
                      <MenuItem value={false}>
                        None
                      </MenuItem>
                      {taxonNames.slice(taxonNames.findIndex(x => x === selectedLevel) + 1).map(level => <MenuItem value={level}>
                        {level}
                      </MenuItem>)}
                    </Select>
                    <FormHelperText>Importing large groups may take a while.</FormHelperText>
                  </p>
                }


              </FormControl >
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          {
            !loadingTaxa &&
            <Button onClick={() => { setAddingSubtaxon(false) }}>Cancel</Button>
          }
          {
            !loadingTaxa && (newTaxon["id"] || selectedParent) &&
            <Button onClick={submitTaxon}>Add this taxon</Button>
          }
          {
            !!loadingTaxa &&
            <p style={{ "padding-right": "30px" }}>Downloading taxa... <CircularProgress size={25} /></p>
          }

        </DialogActions>
      </Dialog>

    </div>


  );
}


export default TaxonSelector;
