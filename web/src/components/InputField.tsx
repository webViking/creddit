import { FormControl, FormErrorMessage, FormLabel, Input } from '@chakra-ui/core';
import { useField } from 'formik';
import React from 'react'

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
    name: string;
    label: string;
}

// !!error
// '' => false
// 'err message' => true
export const InputField: React.FC<InputFieldProps> = ({label,size:_ ,...props}) => {
    const [field, {error}] = useField(props);
    return (
        <FormControl isInvalid={!!error}>
            <FormLabel htmlFor={field.name}>{label}</FormLabel>
            <Input {...field} {...props} id={field.name} placeholder={props.placeholder} />
            {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
        </FormControl>
    );
}