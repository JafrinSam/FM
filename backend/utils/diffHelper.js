export const getChanges = (originalDoc, updateData, allowedFields) => {
  const changes = {};

  allowedFields.forEach((field) => {
    // Skip if the update payload doesn't include this field
    if (updateData[field] === undefined) return;

    const oldValue = originalDoc[field];
    const newValue = updateData[field];

    // Convert to string for comparison (Handles ObjectIds and Dates safely)
    const strOld = oldValue?.toString() || '';
    const strNew = newValue?.toString() || '';

    // Only log if they are actually different
    if (strOld !== strNew) {
      changes[field] = {
        old: oldValue,
        new: newValue
      };
    }
  });

  return changes;
};