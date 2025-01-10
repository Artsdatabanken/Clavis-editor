import React, {useEffect} from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  ButtonGroup,
} from "@mui/material";

import {
  getBestString,
} from "../Utils";

function StatementEditDialogue({
  languages,
  currentTaxon,
  currentCharacter,
  currentStatements,
  setCurrentStatements,
  setStatementValue,
  setStatements,
  deleteStatements,
}) {


  const language = languages[0];


  const EditDialog = () => {
    if (!currentStatements.length) {
      return null;
    }

    return (
      <Dialog open={true}>
        <DialogTitle>Set statement</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Specify the character for this taxon
          </DialogContentText>

          <p>
            <b>Taxon:</b>&nbsp;
            {currentTaxon.scientificName || currentTaxon.label[language]}
          </p>

          <p>
            <b>Character:</b>&nbsp;
            {getBestString(currentCharacter.title, languages)}
          </p>
          <div style={{ flexGrow: "1" }}>
            {currentStatements.map((fact) => (
              <div
                key={fact.id}
                style={{ flexGrow: "1" }}
                className="sideBySide"
              >
                <div>
                  {getBestString(
                    currentCharacter["states"].find(
                      (x) => x.id === fact.value
                    )["title"], languages
                  )}
                </div>
                <ButtonGroup
                  size="small"
                  aria-label="outlined primary button group"
                >
                  <Button
                    variant={fact.frequency === 1 ? "contained" : "outlined"}
                    color="success"
                    onClick={(e) => setStatementValue("frequency", fact, 1)}
                  >
                    Always
                  </Button>
                  <Button
                    variant={
                      fact.frequency !== 1 && fact.frequency > 0
                        ? "contained"
                        : "outlined"
                    }
                    color="warning"
                    onClick={(e) => setStatementValue("frequency", fact, 0.5)}
                  >
                    In some cases
                  </Button>
                  <Button
                    variant={fact.frequency === 0 ? "contained" : "outlined"}
                    color="error"
                    onClick={(e) => setStatementValue("frequency", fact, 0)}
                  >
                    Never
                  </Button>
                </ButtonGroup>
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCurrentStatements([]);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              deleteStatements();
            }}
          >
            Delete
          </Button>
          <Button
            onClick={() => {
              setStatements();
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    )
  };

  useEffect(() => {

    console.log("Dialogue mounted");

    return () => {
      console.log("Dialogue unmounted");
    }
  }, []);

  return (
    <EditDialog />
  );
}

export default StatementEditDialogue;
