// (un)dismisses a taxon or the descendant by taxon id if present in this branch
const toggleDismiss = (taxon, taxonId) => {
  if (taxon.id === taxonId) {
    taxon.dismissed = !taxon.dismissed;
  } else if (taxon.children) {
    taxon.children = taxon.children.map((child) =>
      toggleDismiss(child, taxonId)
    );
  }
  return taxon;
};

// calculates the relevances of a taxon and it's children
const setBranchRelevances = (taxon, alreadyIrrelevant) => {
  // by default, a taxon is relevant if it is not the child of an irrelevant taxon, has not been dismissed and does not have any conflicts
  taxon.isRelevant =
    !alreadyIrrelevant && !taxon.dismissed && !taxon.conflicts.length;

  // by default, irrelevance is the opposite of relevance (but this may change if it has irrelevant children)
  taxon.isIrrelevant = !taxon.isRelevant;

  if (taxon.children && taxon.children.length) {
    // if it has children, set the (ir)relevances for those
    taxon.children = setTaxonRelevances(taxon.children, taxon.isIrrelevant);

    // a relevant taxon stays relevant only if it has any relevant children
    taxon.isRelevant =
      taxon.isRelevant && taxon.children.some((child) => child.isRelevant);

    // a taxon becomes irrelevant if it is an endPoint with no relevant children, or not an endPoint with any irrelevant children
    // TODO: this will not work correctly, given the new format with isEndPoint, which can have an entire tree below it

    taxon.isIrrelevant =
      taxon.isIrrelevant ||
      (taxon.isEndPoint
        ? !taxon.children.some((child) => child.isRelevant)
        : taxon.children.some((child) => child.isIrrelevant));
  }

  return taxon;
};

// sets the relevances and irrelevances of taxa (as endpoint or parent of an endpoint)
const setTaxonRelevances = (taxa, alreadyIrrelevant = false) => {
  return taxa.map((taxon) => setBranchRelevances(taxon, alreadyIrrelevant));
};

// for a list of taxa, see if there is a statement from a given list (usually for one character) for all relevant taxa
const isRelevantForAllTaxa = (taxa, statements) => {
  // if there are no taxa, the answer is no
  if (taxa === undefined || !taxa.length) {
    return false;
  }

  // only consider taxa that are not excluded
  taxa = taxa.filter((taxon) => !(taxon.dismissed || taxon.conflicts.length));

  for (let taxon of taxa) {
    // if it has a statement or does not have to be considered, everything is okay with this branch
    if (statements.some((s) => s.taxon === taxon.id) || !taxon.isRelevant) {
      continue;
    }

    // if not, the children (if any) have to be checked
    if (!isRelevantForAllTaxa(taxon.children, statements)) {
      return false;
    }
  }

  // if no taxon returned false, it must be true
  return true;
};

// checks if a taxon id is present in a taxon tree
const isRelevantTaxon = (taxonId, taxa) => {
  if (!taxa) {
    return false;
  }

  for (let taxon of taxa) {
    if (taxon.id === taxonId) {
      return taxon.isRelevant;
    }
    if (isRelevantTaxon(taxonId, taxon.children)) {
      return true;
    }
  }
};

const removeInferrences = (stateObject) => {
  stateObject.characters.forEach((character) => {
    character.states.forEach((state) => {
      if (!state.isAnswered) {
        stateObject = setFact(stateObject, state.id, undefined);
      }
    });
  });
  return stateObject;
};

const setTaxaConflicts = (taxa, state, relevantStatements) => {
  return taxa.map((taxon) => {
    if (
      state.answerIs !== undefined &&
      !taxon.conflicts.includes(state.id) &&
      relevantStatements.some(
        (statement) =>
          statement.taxon === taxon.id &&
          statement.frequency === +!state.answerIs
      )
    ) {
      taxon.conflicts = [...taxon.conflicts, state.id];
    } else if (state.answerIs === undefined) {
      taxon.conflicts = taxon.conflicts.filter(
        (conflict) => {
          return conflict !== state.id
        }
      );

    }

    if (taxon.children && taxon.children.length) {
      taxon.children = setTaxaConflicts(
        taxon.children,
        state,
        relevantStatements
      );
    }

    return taxon;
  });
};

const setFact = (stateObject, stateId, value) => {
  // give the alternative the new value, remembering the old one
  stateObject.characters = stateObject.characters.map((character) => {
    let isTargetCharacter = false;
    character.states.map((state) => {
      if (state.id === stateId) {
        state.answerIs = value;
        isTargetCharacter = true;
      }
      return state;
    });

    // mark the character as answered if true and containing any answer, unanswered if it just went from true to undefined
    if (isTargetCharacter) {
      if (
        value &&
        character.states.some((state) => state.isAnswered)
      ) {
        character.isAnswered = true;
      } else if (
        !character.states.some((state) => state.answerIs)
      ) {
        character.isAnswered = false;
      }
    }
    return character;
  });






  let relevantAlternative;

  for (let c of stateObject.characters) {
    relevantAlternative = c.states.find((a) => a.id === stateId);
    if (relevantAlternative) {
      break;
    }
  }

  let relevantStatements = stateObject.statements.filter(
    (s) => s.value === stateId
  );

  // add or remove conflicting *alternatives*
  stateObject.taxa = setTaxaConflicts(
    stateObject.taxa,
    relevantAlternative,
    relevantStatements
  );

  stateObject.taxa = setTaxonRelevances(stateObject.taxa);

  return stateObject;
};

const answer = (stateObject, stateId, value) => {

  // mark it as (un)answered
  stateObject.characters.map((character) => {
    character.states.map((state) => {
      if (state.id === stateId) {
        state.isAnswered = value !== undefined;
      }
      return state;
    });
    return character;
  });


  // set the value of the alternative, the answered state of the character, and add/remove conflicts
  stateObject = setFact(stateObject, stateId, value);



  // if removing answer, for every earlier inferrence, undo with setFact
  if (value === undefined) {
    stateObject = removeInferrences(stateObject);
  }


  // moving to giveAnswers
  // stateObject = inferAlternatives(stateObject);

  return stateObject;
};

const getAnswer = (stateId, characters) => {
  for (let character of characters) {
    let state = character.states.find(
      (a) => a.id === stateId
    );
    if (state) {
      return state.answerIs;
    }
    return null;
  }
};

const checkLogicalPremise = (premise, characters) => {
  if (Array.isArray(premise) && premise.length === 1) {
    premise = premise[0];
  }

  if (typeof premise === "string") {
    return getAnswer(premise, characters);
  }

  if (premise.NOT) {
    return !checkLogicalPremise(premise.NOT, characters);
  }

  if (premise.AND) {
    if (premise.AND.length === 1) {
      return checkLogicalPremise(premise.AND, characters);
    } else {
      return (
        checkLogicalPremise(premise.AND[0], characters) &&
        checkLogicalPremise({ AND: premise.AND.slice(1) }, characters)
      );
    }
  }

  if (premise.OR) {
    if (premise.OR.length === 1) {
      return checkLogicalPremise(premise.OR, characters);
    } else {
      return (
        checkLogicalPremise(premise.OR[0], characters) ||
        checkLogicalPremise({ OR: premise.OR.slice(1) }, characters)
      );
    }
  }

  if (premise["<"]) {
    return getAnswer(premise["<"][0], characters) < premise["<"][1];
  }

  if (premise[">"]) {
    return getAnswer(premise[">"][0], characters) > premise[">"][1];
  }

  return undefined;
};

const setTaxaRelevancesByIds = (taxa, ids) => {
  // if taxon has id that is right, return entire thing
  // if it has id but not the right one:
  // if it has no children with ids, set it to dismissed
  // otherwise, map the children

  return taxa
    .map((taxon) => {
      if (
        taxon.externalReference &&
        !ids.find(
          (x) =>
            x === `${taxon.externalReference.externalId}` ||
            (taxon.HigherClassification &&
              taxon.HigherClassification.find((h) => h.ScientificNameId === x))
        )
      ) {
        if (
          !taxon.children ||
          !taxon.children.find((c) => c.externalReference)
        ) {
          // taxon.dismissed = true;
          taxon = undefined;
        } else {
          taxon.children = filterTaxaByIds(taxon.children, ids);
          taxon = !!taxon.children.length ? taxon : undefined;
        }
      }
      return taxon;
    })
    .filter((taxon) => !!taxon);
};

// marks all taxa that don't include or are part of a list of taxa (as ids) as dismissed
export const filterTaxaByIds = (taxa, ids) => {
  taxa = setTaxaRelevancesByIds(taxa, ids);
  return setTaxonRelevances(taxa);
};

const dismissAllExcept = (taxa, taxaToKeep) => {
  return taxa.map((taxon) => {
    if (taxon.isEndPoint || !taxon.children) {
      if (!taxaToKeep.includes(taxon.scientificName)) {
        taxon.dismissed = true;
      }
    } else if (taxon.children) {
      taxon.children = dismissAllExcept(taxon.children, taxaToKeep);
    }
    return taxon;
  });
};

const containsTaxon = (taxon, scientificNames) => {
  if (taxon.isEndPoint || !taxon.children) {
    return scientificNames.includes(taxon.scientificName);
  } else if (taxon.children) {
    return taxon.children.some((child) =>
      containsTaxon(child, scientificNames)
    );
  }
  return false;
};

const dismissAllExceptCommonTaxon = (taxa, taxaToKeep) => {
  return taxa.map((taxon) => {
    if (!containsTaxon(taxon, taxaToKeep)) {
      taxon.dismissed = true;
    }
    return taxon;
  });
};

const getResultTaxa = (taxon) => {
  if (Array.isArray(taxon)) {
    return taxon
      .map((t) => getResultTaxa(t))
      .filter((t) => t !== null)
      .flat();
  }

  if (taxon.isRelevant) {
    if (taxon.children && taxon.children.length && !taxon.isEndPoint) {
      return getResultTaxa(taxon.children);
    } else {
      return taxon;
    }
  }

  return null;
};

export const getRelevantTaxaCount = (taxa) => {

  if (Array.isArray(taxa)) {
    return taxa
      .map((t) => getRelevantTaxaCount(t))
      .reduce((acc, tax) => acc + tax, 0);
  }

  if (!taxa.isRelevant) {
    return 0;    
  }

  if (taxa.isEndPoint || !taxa.children || !taxa.children.length) {
    return 1;
  }

  return getRelevantTaxaCount(taxa.children);
};

// answers a set of alternatives with their values
export const giveAnswers = (stateObject, answers) => {
  answers.forEach((a) => {
    let id, value;
    [id, value] = a;

    stateObject = answer(stateObject, id, value);
  });

  stateObject = inferAlternatives(stateObject);

  stateObject.relevantTaxaCount = getRelevantTaxaCount(stateObject.taxa);

  // Show the results if there is one taxon left, or no questions left to ask
  if (
    stateObject.relevantTaxaCount === 1 ||
    !stateObject.characters.reduce(
      (count, char) => count + (!char.isAnswered && char.relevant !== false),
      0
    )
  ) {
    stateObject.results = getResultTaxa(stateObject.taxa);
    stateObject.modalObject = { results: stateObject.results };
    stateObject.modalObject.keys = stateObject.keys;
    stateObject.modalObject.key = stateObject.id;
  }
  return stateObject;
};

// gives a taxon and all of it's children an empty list of conflicts, standard relevance, and a small and a large media url
export const initElement = (element, mediaElements, persons, organizations) => {
  let elementType = element.id ? element.id.split(":")[0] : "";

  const getObject = (id, objects) => {
    if (typeof id === "string") {
      id = objects.find((x) => x.id === id);
    } else if (Array.isArray(id)) {
      id = id.map((x) => getObject(x, objects));
    }
    return id;
  };

  // if the element is the entire key
  if (element.statements) {
    ({ mediaElements, persons, organizations } = element);

    element.characters = element.characters.map((x) =>
      initElement(x, mediaElements, persons, organizations)
    );
    element.taxa = element.taxa.map((x) =>
      initElement(x, mediaElements, persons, organizations)
    );

    element.mediaElements = element.mediaElements.map((file) => {
      if (Array.isArray(file.mediaElement)) {
        file.mediaElement = file.mediaElement.map((m) =>
          initElement(m, mediaElements, persons, organizations)
        );
      }
      return file;
    });
  }
  // if the element is a taxon
  else if (elementType === "taxon") {
    element.conflicts = [];
    element.isRelevant = true;
    element.isIrrelevant = false;

    if (element.children) {
      element.children = element.children.map((child) =>
        initElement(child, mediaElements, persons, organizations)
      );
    }
  }

  // if the element is a character
  else if (elementType === "character") {
    element.states = element.states.map((state) =>
      initElement(state, mediaElements, persons, organizations)
    );
  }

  element.creators = getObject(element.creators, persons);
  element.contributors = getObject(element.contributors, persons);
  element.publishers = getObject(element.publishers, organizations);
  element.media = getObject(element.media, mediaElements);
  element.init = true;

  if (element.media) {
    element.media = initElement(
      element.media,
      mediaElements,
      persons,
      organizations
    );

    // get a separate small and large media elements
    // if (element.media && Array.isArray(element.media.mediaElement)) {
    //   element.media_small =
    //     element.media.mediaElement.find((m) => m.height >= small_size) ||
    //     element.media.mediaElement[element.media.mediaElement.length - 1];
    //   element.media_large =
    //     element.media.mediaElement.find((m) => m.height >= large_size) ||
    //     element.media.mediaElement[element.media.mediaElement.length - 1];
    // } else if (element.media) {
    //   element.media_small = element.media_large = element.media.mediaElement;
    // }
  }

  return element;
};

// sets a taxon as dismissed or not dismissed, whatever is the opposite of the current status
export const toggleTaxonDismissed = (stateObject, taxonId) => {
  stateObject.taxa = stateObject.taxa.map((taxon) =>
    toggleDismiss(taxon, taxonId)
  );

  stateObject.taxa = setTaxonRelevances(stateObject.taxa);
  stateObject = removeInferrences(stateObject);
  stateObject = inferAlternatives(stateObject);
  stateObject.relevantTaxaCount = getRelevantTaxaCount(stateObject.taxa);

  if (stateObject.relevantTaxaCount === 1) {
    stateObject.results = getResultTaxa(stateObject.taxa);
    stateObject.modalObject = { results: stateObject.results };
  }

  return stateObject;
};

// deducts the answers for unanswered alternatives, and marks the character as relevant or irrelevant
export const inferAlternatives = (stateObject) => {

  let relevantStatements = stateObject.statements.filter((sm) =>
    isRelevantTaxon(sm.taxon, stateObject.taxa)
  );



  // set negatives
  // if a sibling is true, it is negative
  // if all relevant statements are 0, it is negative
  stateObject.characters.forEach((character) => {
    character.states
      .filter(
        (state) => {
          return state.answerIs === undefined &&
            (character.states.some((sibling) => sibling.answerIs) ||
              !relevantStatements.some(
                (sm) => sm.value === state.id && sm.frequency !== 0
              ))
        }
      )
      .forEach((state) => {
        stateObject = setFact(stateObject, state.id, false);
      });
  });

  // set positives
  // if it is the only one remaining, it is positive
  // if all relevant statements are 1, it is positive
  stateObject.characters
    .filter((c) => !c.isAnswered)
    .forEach((character) => {
      character.states
        .filter(
          (state) =>
            state.answerIs === undefined &&
            (character.states.filter(
              (sibling) => sibling.answerIs === undefined
            ).length === 1 ||
              !relevantStatements.some(
                (sm) => sm.value === state.id && sm.frequency !== 1
              ))
        )
        .forEach((state) => {
          stateObject = setFact(stateObject, state.id, true);
        });
    });

  // set relevance of characters
  // it is irrelevant if it has no answers and either everything is known, or a currently relevant taxon has no statement for it)
  // otherwise it is relevant
  stateObject.characters = stateObject.characters.map((character) => {
    if (
      !character.states.some((state) => state.isAnswered) &&
      (!character.states.some(
        (state) => state.answerIs === undefined
      ) ||
        !isRelevantForAllTaxa(
          stateObject.taxa,
          relevantStatements.filter((sm) => sm.character === character.id)
        ))
    ) {
      character.relevant = false;
    } else {
      character.relevant =
        !character.logicalPremise ||
        !!checkLogicalPremise(character.logicalPremise, stateObject.characters);
    }
    return character;
  });

  return stateObject;
};

export const isPartOfKey = (taxa, scientificName) => {
  for (let taxon of taxa) {
    if (
      taxon.scientificName === scientificName ||
      (taxon.children && isPartOfKey(taxon.children, scientificName))
    ) {
      return true;
    }
  }
  return false;
};

export const filterTaxaByNames = (stateObject, taxaToKeep, keepCommonTaxon) => {
  if (!keepCommonTaxon) {
    stateObject.taxa = dismissAllExcept(stateObject.taxa, taxaToKeep);
  } else {
    stateObject.taxa = dismissAllExceptCommonTaxon(
      stateObject.taxa,
      taxaToKeep
    );
  }

  stateObject.taxa = setTaxonRelevances(stateObject.taxa);
  stateObject = inferAlternatives(stateObject);

  return stateObject;
};
