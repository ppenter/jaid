import React from 'react';

export const ErrorPage = (props: any) => {
    const { code='404', message='Page not found' } = props;
    return (
        <div className='w-screen h-screen flex flex-col items-center justify-center'>
        <h1 className='text-4xl font-bold'>{code}</h1>
        <p>{message}</p>
        <hr className='w-1/2 my-4'/>
        <p className='text-xs'>JAID FRAMEWORK</p>
        </div>
    );
}