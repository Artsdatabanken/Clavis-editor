import React from "react";

import Card from "@mui/material/Card";
import {
  FormGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  CardContent,
  Select,
  MenuItem,
  Button,
} from "@mui/material";

import SortableList from "./SortableList";

import { languageNames, getMultipleLanguageInputs } from "../Utils";

const LanguageItem = (l) => {
  return (
    <h3 style={{ display: "inline-block", margin: "0em" }}>
      <img
        alt={languageNames[l]}
        style={{ width: "25px" }}
        src={"./flags/" + l + ".svg"}
      />{" "}
      {languageNames[l]}
    </h3>
  );
};

function Home({ clavis, replaceItem, newPerson, newImage }) {



  const onFieldChange = (field, item, language, value, service) => {
    console.log("onFieldChange", field, item, language, value, service);

    if (!(field in clavis) && field !== "creator") {
      clavis[field] = {};
    }

    if (field === "geography") {
      if (!("name" in clavis["geography"])) {
        clavis["geography"]["name"] = {};
      }
      clavis["geography"]["name"][language] = value;
    } else if (field === "descriptionUrl") {
      clavis["descriptionUrl"][language] = {
        serviceId: "service:nbic_page",
        externalId: value,
      };
    } else if (field === "creator") {
      if (!clavis["creator"]) {
        let personId = newPerson();
        clavis["creator"] = personId;
        if (!clavis.persons) {
          clavis["persons"] = [
            {
              id: personId,
              name: {},
            },
          ];
        }
      }

      clavis["persons"].map((p) => {
        if (p["id"] === clavis["creator"]) {
          p["name"][language] = value;
        }
        return p;
      });
    } else {
      clavis[field][language] = value;
    }
    replaceItem(clavis);
  };

  const addLanguage = (l) => {
    if (!!l && !clavis["language"].includes(l)) {
      clavis["language"] = clavis["language"].concat([l]);
      replaceItem(clavis);
    }
  };

  const setLanguages = (l) => {
    clavis["language"] = l;
    replaceItem(clavis);
  };

  const setLicense = (e) => {
    clavis["license"] = e.target.value;
    replaceItem(clavis);
  };

  const [selectedLanguage, setSelectedLanguage] = React.useState(false);

  return (
    <div className="content-section">
      <h1 className="bp4-heading">General information</h1>

      <Card className="formCard">
        <CardContent>
          <FormLabel component="legend">Supported languages</FormLabel>

          <SortableList
            items={clavis.language.map((l) => {
              return { render: LanguageItem, id: l };
            })}
            setItems={setLanguages}
          />

          <FormControl component="fieldset" variant="standard">
            {
              <FormGroup>
                <Select
                  fullWidth
                  sx={{ m: 0, marginY: "5px" }}
                  id="statement-taxon"
                  value={selectedLanguage || ""}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {!clavis["language"].length && (
                    <MenuItem value={false}>Add at least one language</MenuItem>
                  )}

                  {Object.entries(languageNames)
                    .filter(
                      ([key, value]) =>
                        clavis["language"].length === 0 ||
                        !clavis["language"].includes(key)
                    )
                    .map(([key, value]) => (
                      <MenuItem value={key} key={key}>
                        {value}
                      </MenuItem>
                    ))}
                </Select>
              </FormGroup>
            }

            <FormHelperText>
              Add languages to the key. At least one language is required. Drag to
              reorder.
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Button
              variant="contained"
              onClick={() => {
                addLanguage(selectedLanguage);
                setSelectedLanguage(false);
              }}
            >
              Add language
            </Button>
          </FormControl>
        </CardContent>
      </Card>

      <Card className="formCard">
        <CardContent>
          <FormControl component="fieldset" variant="standard" fullWidth>
            <FormLabel>License</FormLabel>
            <RadioGroup
              name="key-license"
              onChange={setLicense}
              value={clavis["license"] || ""}
            >
              <FormControlLabel
                label="CC BY 4.0"
                control={<Radio />}
                value="https://creativecommons.org/licenses/by/4.0/"
              />
              <FormControlLabel
                label="CC BY-SA 4.0"
                control={<Radio />}
                value="https://creativecommons.org/licenses/by-sa/4.0/"
              />
            </RadioGroup>
            <FormHelperText>
              Determines how others may reuse this key. Required.
            </FormHelperText>
          </FormControl>
        </CardContent>
      </Card>

      {!!clavis.language.length && (
        <Card className="formCard">
          <CardContent>
            <FormControl component="fieldset" variant="standard" fullWidth>
              <FormLabel component="legend">Title</FormLabel>
              <FormGroup>
                {getMultipleLanguageInputs({
                  item: clavis,
                  field: "title",
                  placeholder: "E.g. 'Birds of Norway'",
                  languages: clavis["language"],
                  required: true,
                  handleChange: onFieldChange,
                })}
              </FormGroup>

              <FormHelperText>Appears as the name of the key.</FormHelperText>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {!!clavis.language.length && (
        <Card className="formCard">
          <CardContent>
            <FormControl component="fieldset" variant="standard" fullWidth>
              <FormLabel component="legend">Creator</FormLabel>
              <FormGroup>
                {getMultipleLanguageInputs({
                  item: !!clavis.creator ? (clavis.persons.find((p) => p.id === clavis.creator))["name"] : undefined,
                  field: "creator",
                  placeholder: "E.g. 'Wouter Koch'",
                  languages: clavis["language"],
                  required: false,
                  handleChange: onFieldChange,
                })}
              </FormGroup>

              <FormHelperText>
                The name of the creator of the key.
              </FormHelperText>
            </FormControl>
          </CardContent>
        </Card>
      )}
      {!!clavis.language.length && (
        <Card className="formCard">
          <CardContent>
            <FormControl component="fieldset" variant="standard" fullWidth>
              <FormLabel component="legend">Audience</FormLabel>
              <FormGroup>
                {getMultipleLanguageInputs({
                  item: clavis,
                  field: "audience",
                  placeholder: "E.g. 'Undergraduate students and up'",
                  languages: clavis["language"],
                  required: false,
                  handleChange: onFieldChange,
                })}
              </FormGroup>

              <FormHelperText>
                Description of the intended audience for the key.
              </FormHelperText>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {!!clavis.language.length && (
        <Card className="formCard">
          <CardContent>
            <FormControl component="fieldset" variant="standard" fullWidth>
              <FormLabel component="legend">Region name</FormLabel>
              <FormGroup>
                {getMultipleLanguageInputs({
                  item: clavis,
                  field: "geography",
                  placeholder: "E.g. 'Norway', 'Europe', 'Trøndelag', etc.",
                  languages: clavis.language,
                  required: false,
                  handleChange: onFieldChange,
                })}
              </FormGroup>
              <FormHelperText>
                The name of the region for which the key is valid (e.g. covers
                all subtaxa).
              </FormHelperText>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {!!clavis.language.length && (
        <Card className="formCard">
          <CardContent>
            <FormControl component="fieldset" variant="standard" fullWidth>
              <FormLabel component="legend">Description</FormLabel>
              <FormGroup>
                {getMultipleLanguageInputs({
                  item: clavis,
                  field: "description",
                  placeholder: "Describe the key",
                  languages: clavis.language,
                  required: false,
                  handleChange: onFieldChange,
                })}
              </FormGroup>

              <FormHelperText>Short description of the key.</FormHelperText>
            </FormControl>
          </CardContent>
        </Card>
      )}
      {!!clavis.language.length && (
        <Card className="formCard">
          <CardContent>
            <FormControl component="fieldset" variant="standard" fullWidth>
              <FormLabel component="legend">Description ID</FormLabel>
              <FormGroup>
                {getMultipleLanguageInputs({
                  item: clavis,
                  field: "descriptionUrl",
                  placeholder: "Provide an ID",
                  languages: clavis.language,
                  required: false,
                  handleChange: onFieldChange,
                })}
              </FormGroup>

              <FormHelperText>
                ID of an article describing the key on NBIC's site.
              </FormHelperText>
            </FormControl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Home;
