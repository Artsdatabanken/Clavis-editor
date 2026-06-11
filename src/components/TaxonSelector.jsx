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

  const getChildren = async (targetRank, id) => {
    let children = []
    setLoadingTaxa(loadingTaxa + 1)

    // Get all children of this taxon
    let res = await axios.get("https://nortaxa.artsdatabanken.no/api/v1/TaxonName/Children/ByScientificNameId/" + id)
    let data = res.data.filter(t => t.taxonomicStatus === "Accepted")

    // Filter for children that match the target rank
    let matchingChildren = data.filter(t => t.rank.toLowerCase() === targetRank.toLowerCase())

    if (matchingChildren.length > 0) {
      // Found taxa at the target rank, process and return them
      for (let c = 0; c < matchingChildren.length; c++) {
        let child = matchingChildren[c];
        let taxon = { "id": "taxon:" + uuidv4().replaceAll("-", "") }
        child = await fillTaxon(taxon, child)
        children.push(child)
      }
    } else {
      // No matches at target rank, recursively search in all children
      // Keep the hierarchy by creating intermediate taxa
      for (let c = 0; c < data.length; c++) {
        let childData = data[c];
        let recursiveChildren = await getChildren(targetRank, childData.scientificNameId)

        // Only create an intermediate taxon if we found target taxa below it
        if (recursiveChildren.length > 0) {
          let intermediateTaxon = { "id": "taxon:" + uuidv4().replaceAll("-", "") }
          intermediateTaxon = await fillTaxon(intermediateTaxon, childData)
          intermediateTaxon.children = recursiveChildren
          children.push(intermediateTaxon)
        }
      }
    }

    setLoadingTaxa(loadingTaxa - 1)
    return children
  }


  const submitTaxon = async () => {
    let submitting = deepClone(newTaxon)
    if (!!importSubtaxaLevel) {
      submitting.children = await getChildren(importSubtaxaLevel, submitting.externalReference.externalId)
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
    else if (v.preferredVernacularNames && v.preferredVernacularNames.length > 0) {
      popular = v.preferredVernacularNames
    }
   

    taxon["scientificName"] = v["presentationName"] || v["ScientificName"] || v["scientificName"]
    taxon["externalReference"] = {
      "serviceId": "service:nbic_taxa",
      "externalId": (v["scientificNameId"] || v["ScientificNameId"] || v["scientificNameID"]).toString()
    }

    if (popular && languages) {
      taxon["vernacularName"] = {}
      popular.forEach(popname => {
        let langCode = null
        let vernacularNameValue = null

       if (popname.nameLanguageIso) {
          langCode = popname.nameLanguageIso
          vernacularNameValue = popname.name
        }

        // Only add vernacular name if the language is supported by the key
        if (langCode && vernacularNameValue && languages.includes(langCode)) {
          taxon.vernacularName[langCode] = vernacularNameValue
        }
      })
    }
    return taxon
  }

  const writeValue = async (e) => {
    setInputValue(e.target.value);







    if (e.target.value.length > 2) {
      let search = await axios.get("https://nortaxa.artsdatabanken.no/api/v1/TaxonName/Search?Search=" + e.target.value + "&MaxResults=5")

      let result = [...search.data]

      setSuggestions([...new Set(result.map(s => {
      if (!!s.acceptedScientificName && !!s.acceptedScientificName.name) {
          let PopularName
          if(!!s.preferredVernacularNames && s.preferredVernacularNames.find(x => x.nameLanguageIso === "nb")) {
            PopularName = s.preferredVernacularNames.find(x => x.nameLanguageIso === "nb").name
          }

          return {
            "PopularName": PopularName,
            "ScientificName": s.acceptedScientificName.name,
            "ScientificNameId": s.acceptedScientificName.nameId,
          }
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
        "https://nortaxa.artsdatabanken.no/api/v1/TaxonName/ByScientificNameId/" +
        (v.scientificNameId || v.scientificNameID || v.ScientificNameId)
      )
      .then((res) => {
        setSelectedLevel(res.data.rank);
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
