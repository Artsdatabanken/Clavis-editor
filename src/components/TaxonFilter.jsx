import React from "react";
import { Button } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { printTaxonName } from "../Utils";

function TaxonFilter({ clavis, languages, taxonFilter, setTaxonFilter }) {
  const language = languages[0];

  const clearFilter = () => {
    setTaxonFilter([]);
  };

  const inverseFilter = () => {
    let ids = [];
    clavis.taxa.forEach((taxon) => {
      ids = ids.concat(getTaxonIds(taxon));
    });

    let newTaxonFilter = [];
    ids.forEach((id) => {
      if (!taxonFilter.includes(id)) {
        newTaxonFilter.push(id);
      }
    });

    setTaxonFilter(newTaxonFilter);
  };

  const getTaxon = (taxa, taxonId) => {
    for (let i = 0; i < taxa.length; i++) {
      if (taxa[i].id === taxonId) {
        return taxa[i];
      }
      if (taxa[i].children) {
        let result = getTaxon(taxa[i].children, taxonId);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };

  const getParent = (taxa, taxonId) => {
    for (let i = 0; i < taxa.length; i++) {
      if (taxa[i].children) {
        if (taxa[i].children.find((child) => child.id === taxonId)) {
          return taxa[i];
        }
        let result = getParent(taxa[i].children, taxonId);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };

  const toggleTaxonFilter = (taxonId) => {
    let newTaxonFilter = [...taxonFilter];

    // If the taxon is not in the filter, add it
    if (!newTaxonFilter.includes(taxonId)) {
      newTaxonFilter.push(taxonId);



      // If all siblings are already in the filter, add the parent to the filter, and so on up to the root
      let parent = getParent(clavis.taxa, taxonId);
      while (parent) {
        let allChildrenSelected = true;
        for (let i = 0; i < parent.children.length; i++) {
          if (!newTaxonFilter.includes(parent.children[i].id)) {
            allChildrenSelected = false;
          }
        }

        if (allChildrenSelected) {
          newTaxonFilter.push(parent.id);
        }
        parent = getParent(clavis.taxa, parent.id);
      }

      // remove duplicates
      newTaxonFilter = newTaxonFilter.filter(
        (item, pos) => newTaxonFilter.indexOf(item) === pos
      );

    } else {
      // If the taxon is already in the filter, check if all of its children are in the filter
      let taxon = getTaxon(clavis.taxa, taxonId);
      let taxonIds = getTaxonIds(taxon);
      let allChildrenSelected = true;
      taxonIds.forEach((id) => {
        if (!newTaxonFilter.includes(id)) {
          allChildrenSelected = false;
        }
      });

      // If all children were already selected, remove this taxon and all its children from the filter
      if (allChildrenSelected) {
        newTaxonFilter = newTaxonFilter.filter(
          (taxon) => !taxonIds.includes(taxon)
        );
      } else {
        // Otherwise, add all children to the filter
        newTaxonFilter = newTaxonFilter.concat(taxonIds);
        // remove duplicates
        newTaxonFilter = newTaxonFilter.filter(
          (item, pos) => newTaxonFilter.indexOf(item) === pos
        );
      }
    }

    setTaxonFilter(newTaxonFilter);
  };

  const getTaxonIds = (taxon) => {
    let ids = [taxon.id];
    if (taxon.children) {
      taxon.children.forEach((child) => {
        ids = ids.concat(getTaxonIds(child));
      });
    }
    return ids;
  };

  const getTaxonRows = (taxon, margins = 0) => {
    let rows = [];

    rows.push(
      <tr
        key={taxon.id}
        onClick={() => toggleTaxonFilter(taxon.id)}
        style={{ cursor: "pointer" }}
      >
        <td>
          {taxonFilter.includes(taxon.id) && <CheckBoxIcon />}
          {!taxonFilter.includes(taxon.id) && <CheckBoxOutlineBlankIcon />}
        </td>
        <td
          key={taxon.id}
          style={{ verticalAlign: "middle", textAlign: "left" }}
        >
          <span
            style={{
              whiteSpace: "nowrap",
              marginLeft: `${1 + margins * 1.5}em`,
            }}
          >
            {printTaxonName(taxon, language)}
          </span>
        </td>
      </tr>
    );

    if (taxon.children) {
      taxon.children.forEach((child) => {
        rows.push(getTaxonRows(child, margins + 1));
      });
    }

    return rows;
  };

  const TaxonForm = ({ taxa }) => {
    let rows = [];

    taxa.forEach((taxon) => {
      rows.push(getTaxonRows(taxon));
    });

    return <>{rows.map((row) => row)}</>;
  };

  return (
    <div>
      <h1 className="bp4-heading">Taxon filter</h1>
      <p>
        Here yout can define the subset of taxa you want to work with in the
        editor. This will keep the table more compact and less computationally
        demanding.
      </p>
      <p>
        If one or more taxa are selected, only these taxa will be shown. Click
        once to select a taxon, click again to select it and all its children.
        Click again to deselect it and all its children.
      </p>
      <Button variant="contained" onClick={clearFilter}>
        Clear all
      </Button>
      &nbsp;
      <Button variant="contained" onClick={inverseFilter}>
        Inverse section
      </Button>
      <TaxonForm taxa={clavis.taxa} />
    </div>
  );
}

export default TaxonFilter;
