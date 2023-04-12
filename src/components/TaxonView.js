
import React from "react";
import {Card, CardContent} from '@mui/material';
import { flattenTaxa, getStatementIcon } from "../Utils"


function TaxonView({ clavis }) {

    const taxaFlattened = flattenTaxa(clavis.taxa)



    const showCharacter = (character, statements) => {
        return (<Card key={character.id + statements[0].id} className="formCard"><CardContent>
            <h3>{character.title[clavis.language[0]]}</h3>
            {
                character.states.map(state => {
                    let statement = statements.find(statement => statement.value === state.id)
                    if (!!statement) {
                        return <p key={statement.id}>{getStatementIcon(statement.frequency)} {state.title[clavis.language[0]]}</p>
                    }
                    return null
                })}
        </CardContent></Card>)
    }

    const showStatements = statements => clavis.characters.map(character => {
        let characterStatements = statements.filter(s => s.character === character.id)
        if (!!characterStatements.length) {
            return showCharacter(character, characterStatements)
        }
        return null
    });


    const showTaxon = taxon => {
        let taxonStatements = clavis.statements.filter(statement => statement.taxon === taxon.id)

        if (!!taxonStatements.length) {
            return (<Card key={taxon.id} className="formCard" style={{"marginBottom": "4em"}}><CardContent>
                <h2>{taxon.scientificName || taxon.label[clavis.language[0]]}</h2>
                {showStatements(taxonStatements)}
                </CardContent></Card>)
        }
        return null
    }



                


    return (
        <div>
            <h1 className="bp4-heading">Per-taxon view</h1>
            <h3>Legend</h3>
            <p>{getStatementIcon(1)} : Always</p>
            <p>{getStatementIcon(0.5)} : In some cases</p>
            <p>{getStatementIcon(0)} : Never</p>

            {taxaFlattened.map(taxon => showTaxon(taxon))}
        </div>


    );
}

export default TaxonView;
