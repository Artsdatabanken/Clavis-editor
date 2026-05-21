import React, {useEffect, useState} from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  ButtonGroup,
  TextField,
  FormGroup,
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
  const isNumerical = currentCharacter?.type === "numerical";

  // Local state for numerical inputs - only synced to parent on Save
  const [numericalValues, setNumericalValues] = useState({});

  // Initialize local numerical values when dialog opens
  const hasStatements = currentStatements.length > 0;
  useEffect(() => {
    if (isNumerical && hasStatements) {
      const initial = {};
      currentStatements.forEach((fact) => {
        const value = fact.value;
        initial[fact.id] = {
          min: Array.isArray(value) && value[0] != null ? String(value[0]) : "",
          max: Array.isArray(value) && value[1] != null ? String(value[1]) : "",
        };
      });
      setNumericalValues(initial);
    }
  }, [isNumerical, hasStatements]); // eslint-disable-line react-hooks/exhaustive-deps
  // Only run on open (hasStatements change), not on currentStatements content changes

  const handleNumericalChange = (factId, field, value) => {
    setNumericalValues((prev) => ({
      ...prev,
      [factId]: {
        ...prev[factId],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    if (isNumerical) {
      // Update currentStatements with local numerical values and pass directly to save
      const updatedStatements = currentStatements.map((fact) => {
        const values = numericalValues[fact.id];
        if (values) {
          const min = values.min === "" ? null : parseFloat(values.min);
          const max = values.max === "" ? null : parseFloat(values.max);
          return { ...fact, value: [min, max] };
        }
        return fact;
      });
      // Pass updated statements directly to setStatements
      setStatements(updatedStatements);
    } else {
      setStatements();
    }
  };

  if (!currentStatements.length) {
    return null;
  }

  return (
    <Dialog open={true}>
      <DialogTitle>Set statement</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {isNumerical
            ? "Specify the numerical range for this taxon"
            : "Specify the character for this taxon"}
        </DialogContentText>

        <p>
          <b>Taxon:</b>&nbsp;
          {currentTaxon.scientificName || currentTaxon.label?.[language]}
        </p>

        <p>
          <b>Character:</b>&nbsp;
          {getBestString(currentCharacter.title, languages)}
          {isNumerical && currentCharacter.unit && (
            <span style={{ color: "#666" }}>
              {" "}({getBestString(currentCharacter.unit, languages)})
            </span>
          )}
        </p>

        {isNumerical ? (
          // Numerical character input - uses local state, no parent rerenders
          <div style={{ marginTop: "16px" }}>
            {currentStatements.map((fact) => (
              <div key={fact.id}>
                <FormGroup row style={{ gap: "16px", alignItems: "center" }}>
                  <TextField
                    label="Min"
                    type="number"
                    value={numericalValues[fact.id]?.min ?? ""}
                    onChange={(e) => handleNumericalChange(fact.id, "min", e.target.value)}
                    style={{ width: "120px" }}
                    InputProps={{
                      inputProps: {
                        step: currentCharacter.stepSize || "any",
                        min: currentCharacter.min,
                        max: currentCharacter.max,
                      },
                    }}
                  />
                  <span>–</span>
                  <TextField
                    label="Max"
                    type="number"
                    value={numericalValues[fact.id]?.max ?? ""}
                    onChange={(e) => handleNumericalChange(fact.id, "max", e.target.value)}
                    style={{ width: "120px" }}
                    InputProps={{
                      inputProps: {
                        step: currentCharacter.stepSize || "any",
                        min: currentCharacter.min,
                        max: currentCharacter.max,
                      },
                    }}
                  />
                  {currentCharacter.unit && (
                    <span style={{ color: "#666" }}>
                      {getBestString(currentCharacter.unit, languages)}
                    </span>
                  )}
                </FormGroup>
                {currentCharacter.min != null && currentCharacter.max != null && (
                  <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    Valid range: {currentCharacter.min} – {currentCharacter.max}
                    {currentCharacter.unit && ` ${getBestString(currentCharacter.unit, languages)}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Categorical character input (original)
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
        )}
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
          onClick={handleSave}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default StatementEditDialogue;
