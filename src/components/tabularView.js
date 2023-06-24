
import React, { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

import Card from '@mui/material/Card';
import { flattenTaxa, getBestString, deepClone, changeStatement, getStatementIcon} from "../Utils"
import {
    Dialog, DialogTitle, DialogContent, DialogContentText,
    DialogActions, Button, ButtonGroup
} from "@mui/material";

function TabularView({ clavis, replaceItem, deleteItem, languages }) {
    const [currentTaxon, setCurrentTaxon] = useState(false);
    const [currentCharacter, setCurrentCharacter] = useState(false);
    const [currentStatements, setCurrentStatements] = useState([]);
    const [statementsAreNew, setStatementsAreNew] = useState(false);
    const [highlightedTaxon, setHighlightedTaxon] = useState(false);
    const [highlightedCharacter, setHighlightedCharacter] = useState(false);

    const language = languages[0]

    let taxaFlattened = flattenTaxa(clavis.taxa)

    const openStatements = (character, taxon) => {
        let filteredStatements = clavis.statements.filter(statement => (
            statement.taxon === taxon.id && statement.character === character.id
        ))


        if (filteredStatements.length === 0) {
            setStatementsAreNew(true)

            character.states.forEach(state => {
                let adding = {}
                adding.taxon = taxon.id
                adding.character = character.id
                adding.value = state.id
                adding.id = "statement:" + uuidv4().replaceAll("-", "")
                filteredStatements.push(
                    adding
                )
            });
        }
        else if (filteredStatements.length < character.states.length) {
            character.states.forEach(state => {
                if (!filteredStatements.find(x => x.value === state.id)) {
                    let adding = {}
                    adding.taxon = taxon.id
                    adding.character = character.idsetStatementsAreNew
                    adding.value = state.id
                    adding.id = "statement:" + uuidv4().replaceAll("-", "")
                    filteredStatements.push(
                        adding
                    )
                }
            });
        }

        setCurrentStatements(deepClone(filteredStatements))
        setCurrentCharacter(character)
        setCurrentTaxon(taxon)
    }

    const highlightTaxon = (taxon) => {
        if (highlightedTaxon === taxon.id) {
            setHighlightedTaxon(false)
        }
        else {
            setHighlightedTaxon(taxon.id)
        }
    }

    const highlightCharacter = (character) => {
        if (highlightedCharacter === character.id) {
            setHighlightedCharacter(false)
        }
        else {
            setHighlightedCharacter(character.id)
        }
    }


    const setStatements = () => {
        if (statementsAreNew) {
            console.log(currentStatements)
            replaceItem(deepClone(clavis.statements).concat(currentStatements))
        }
        else {
            replaceItem(currentStatements, null, true)
        }

        setCurrentStatements([])
        setStatementsAreNew(false)
    }

    const deleteStatements = () => {
        replaceItem(deleteItem(currentStatements), "statements")
        setCurrentStatements([])
        setStatementsAreNew(false)
    }

    const setStatementValue = (field, fact, value) => {
        setCurrentStatements(changeStatement(currentStatements, fact.id, value, currentCharacter))

        // setCurrentStatements(currentStatements.map(statement => {
        //     if (fact.id === statement.id) {
        //         fact[field] = value
        //         return fact
        //     }
        //     else if (field === "frequency" && value === 1 && (currentCharacter.type !== "exclusive" || currentCharacter.type)) {
        //         statement["frequency"] = 0
        //     }
        //     else if (field === "frequency" && value > 0 && (currentCharacter.type !== "exclusive" || currentCharacter.type) && statement["frequency"] === 1) {
        //         statement["frequency"] = .5
        //     }

        //     return statement
        // }))
    }

    const TaxonHeaders = ({ taxa }) => (
        <>
            {taxa.map(taxon =>
                <td key={taxon.id} onClick={() => highlightTaxon(taxon)} style={{ "verticalAlign": "bottom", "textAlign": "center" }}>
                    <span style={{
                        "msWritingMode": "tb-rl",
                        "WebkitWritingMode": "vertical-rl",
                        "writingMode": "vertical-rl",
                        "transform": "rotate(180deg)",
                        "whiteSpace": "nowrap",
                        "width": "16pt",
                        "backgroundColor": (highlightedTaxon === taxon.id ? "yellow" : "white")
                    }}

                    >{taxon.level}{taxon.scientificName || taxon.label[language]}</span></td>
            )}
        </>);

    const Statement = ({ character, state, taxon, lastLevel, lastResult }) => {

        let relevant = clavis.statements.filter(element => (
            element.taxon === taxon.id && element.character === character.id
        ))
        let thisStatement = relevant.find(e => (e.value === state.id))

        if (typeof (lastResult) !== "undefined" && lastLevel.length < taxon.level.length) {
            return {
                "html": <td key={taxon.id + state.id} style={{
                    "cursor": "not-allowed", "border": "1px solid grey", "opacity": "0.3", "color": "lightgrey", "textAlign": "center",
                    "backgroundColor": "rgba(255, 255, 0, " + ((0.5 * (highlightedTaxon === taxon.id)) + (0.5 * (highlightedCharacter === character.id))) ** 2 + ")"
                }}>{getStatementIcon(lastResult)}</td>,
                "lastLevel": lastLevel,
                "lastResult": lastResult
            }
        }

        if (!!thisStatement) {
            return {
                "html": <td key={taxon.id + state.id} onClick={() => openStatements(character, taxon)} style={{
                    "cursor": "pointer", "border": "1px solid grey", "textAlign": "center",
                    "backgroundColor": "rgba(255, 255, 0, " + ((0.5 * (highlightedTaxon === taxon.id)) + (0.5 * (highlightedCharacter === character.id))) ** 2 + ")"
                }}>{getStatementIcon(thisStatement.frequency)}</td>,
                "lastLevel": taxon.level,
                "lastResult": thisStatement.frequency
            }
        }

        if ((!character.type || character.type === "exclusive") && relevant.length) {
            return {
                "html": <td key={taxon.id + state.id} onClick={() => openStatements(character, taxon)} style={{
                    "cursor": "pointer", "border": "1px solid grey", "textAlign": "center",
                    "backgroundColor": "rgba(255, 255, 0, " + ((0.5 * (highlightedTaxon === taxon.id)) + (0.5 * (highlightedCharacter === character.id))) ** 2 + ")"
                }}>{getStatementIcon(0)}</td>,
                "lastLevel": taxon.level,
                "lastResult": 0
            }
        }

        return {
            "html": <td key={taxon.id + state.id} onClick={() => openStatements(character, taxon)} style={{
                "cursor": "pointer", "border": "1px solid grey", "textAlign": "center",
                "backgroundColor": "rgba(255, 255, 0, " + ((0.5 * (highlightedTaxon === taxon.id)) + (0.5 * (highlightedCharacter === character.id))) ** 2 + ")"
            }}></td>,
            "lastLevel": taxon.level,
            "lastResult": undefined
        }

    };

    const Statements = ({ character, state }) => {
        let lastLevel = ""
        let lastResult
        let statement

        return taxaFlattened.map(taxon => {
            statement = Statement({ "character": character, "state": state, "taxon": taxon, "lastLevel": lastLevel, "lastResult": lastResult });
            lastLevel = statement.lastLevel;
            lastResult = statement.lastResult;
            return statement.html
        })

    };

    const States = ({ character }) => (
        <>
            {character.states.map(state =>
                <tr key={state.id}>
                    <td onClick={() => highlightCharacter(character)} style={{ "paddingLeft": "25px", "borderBottom": "1px solid black", "backgroundColor": (highlightedCharacter === character.id ? "yellow" : "white") }}>{getBestString(state.title)}</td>
                    <Statements character={character} state={state} />
                </tr>
            )}
        </>);


    const Characters = ({ characters }) => (
        <>
            {characters.map(character =>
                <React.Fragment key={character.id}>
                    <tr>
                        <td onClick={() => highlightCharacter(character)} style={{ "borderBottom": "1px solid black", "backgroundColor": (highlightedCharacter === character.id ? "yellow" : "white") }}><span style={{ "fontWeight": "bold" }}>{character.title.en || character.title.nb || character.title.nn}</span></td>
                    </tr>
                    <States character={character} />
                </React.Fragment>
            )}
        </>);

    const Tabular = () => (<table style={{ "tableLayout": "fixed", "fontSize": "12pt", "borderCollapse": "collapse" }}><tbody>
        <tr>
            <td style={{ "width": "200px" }}><div style={{ "width": "400px" }} /></td><TaxonHeaders taxa={taxaFlattened} />
        </tr>
        <Characters characters={clavis.characters} />

    </tbody>
    </table>);

    return (
        <div>
            <h1 className="bp4-heading">Table view</h1>

            <Card >
                <Tabular />
            </Card>

            {!!currentStatements.length &&
                <Dialog open={true}>
                    <DialogTitle>Set statement</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Specify the character for this taxon
                        </DialogContentText>


                        <p><b>Taxon:</b>&nbsp;
                            {currentTaxon.scientificName || currentTaxon.label[language]}
                        </p>

                        <p><b>Character:</b>&nbsp;
                            {getBestString(currentCharacter.title)}
                        </p>
                        <div style={{ flexGrow: "1" }}>

                            {currentStatements.map(fact =>
                                <div key={fact.id} style={{ flexGrow: "1" }} className="sideBySide">
                                    <div>{getBestString(currentCharacter["states"].find(x => x.id === fact.value)["title"])}</div>
                                    <ButtonGroup size="small" aria-label="outlined primary button group">
                                        <Button variant={fact.frequency === 1 ? "contained" : "outlined"} color="success" onClick={e => setStatementValue("frequency", fact, 1)}>Always</Button>
                                        <Button variant={fact.frequency !== 1 && fact.frequency > 0 ? "contained" : "outlined"} color="warning" onClick={e => setStatementValue("frequency", fact, .5)}>In some cases</Button>
                                        <Button variant={fact.frequency === 0 ? "contained" : "outlined"} color="error" onClick={e => setStatementValue("frequency", fact, 0)}>Never</Button>
                                    </ButtonGroup>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => { setCurrentStatements([]) }}>Cancel</Button>
                        <Button onClick={() => { deleteStatements() }}>Delete</Button>
                        <Button onClick={() => { setStatements() }}>Save</Button>
                    </DialogActions>
                </Dialog>
            }

        </div>


    );
}

export default TabularView;
