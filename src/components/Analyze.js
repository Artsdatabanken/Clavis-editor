
import React from "react";
import { Card, Alert } from "@mui/material";

import {
    getBestString
} from "../Utils";

function Analyze({ clavis }) {

    const getAncestry = (taxa, resultObject = {}, ancestry = []) => {
        taxa.forEach(taxon => {
            resultObject[taxon.id] = ancestry.concat([taxon.id])
            if (taxon.children) {
                resultObject = getAncestry(taxon.children, resultObject, resultObject[taxon.id])
            }
        });
        return resultObject
    }

    const taxonomy = getAncestry(clavis.taxa)

    const getFacts = (taxon, freq) => {
        return clavis.statements
            .filter(s => taxonomy[taxon].includes(s.taxon) && s.frequency === freq)
            .map(s => s.value)
    }

    const areDiscernable = (taxonX, taxonY) => {
        let all_facts = getFacts(taxonX, 1).concat(getFacts(taxonY, 0))

        for (let index = 0; index < all_facts.length; index++) {
            if (all_facts.indexOf(all_facts[index]) !== index) {
                return true
            }
        }

        all_facts = getFacts(taxonX, 0).concat(getFacts(taxonY, 1))

        for (let index = 0; index < all_facts.length; index++) {
            if (all_facts.indexOf(all_facts[index]) !== index) {
                return true
            }
        }

        return false
    }

    const getEndpoints = (taxa) => {
        let result = []

        taxa.forEach(taxon => {
            if (taxon.isEndpoint || !taxon.children || !taxon.children.length) {
                result = result.concat([{ "id": taxon.id, "name": taxon.scientificName || getBestString(taxon.label) || taxon.id }])
            }
            else if (taxon.children && taxon.children.length) {
                result = result.concat(getEndpoints(taxon.children))
            }
        })

        return result
    }

    const endpoints = getEndpoints(clavis.taxa)

    const getIndiscernables = (taxa) => {
        let results = []

        if (taxa.length < 2) {
            return results
        }

        const focal = taxa[0]
        const rest = taxa.slice(1)
        rest.forEach(restTaxon => {
            if (!areDiscernable(focal.id, restTaxon.id)) {
                results = results.concat([[focal, restTaxon]])
            }
        })

        results = results.concat(getIndiscernables(rest))
        return results
    }


    return (
        <div>
            <h1 className="bp4-heading">Analysis</h1>

            <Card >
                {getIndiscernables(endpoints).map(
                    x => (
                        <Alert severity="warning" key={x[0].id + x[1].id}>{x[0].name} and {x[1].name} are not discernable</Alert>
                    )
                )}
            </Card>



        </div>

    );
}

export default Analyze;
