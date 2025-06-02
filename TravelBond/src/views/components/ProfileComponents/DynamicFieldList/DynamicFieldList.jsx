import React from "react";
import { Form, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";

const DynamicFieldList = ({
  fields,
  onAddField,
  onRemoveField,
  onChangeField,
  placeholder,
}) => {
  return (
    <>
      {fields.map((field, index) => (
        <div key={index} className="d-flex align-items-center mb-2">
          <Form.Control
            type="text"
            value={field}
            onChange={(e) => onChangeField(index, e.target.value)}
            placeholder={`${placeholder} ${index + 1}`}
          />
          {fields.length > 1 && (
            <Button
              variant="link"
              onClick={() => onRemoveField(index)}
              className="ms-2"
            >
              <FontAwesomeIcon icon={faMinus} />
            </Button>
          )}
        </div>
      ))}
      <Button variant="link" onClick={onAddField}>
        <FontAwesomeIcon icon={faPlus} /> Add Another {placeholder}
      </Button>
    </>
  );
};

export default DynamicFieldList;