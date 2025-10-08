import React from 'react'

const LoginForm = () => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <div className='bg-white p-8 rounded shadow-md w-full max-w-md'>
            <h2 className='text-2xl font-bold mb-6 text-center'>Login</h2>
            <form>
                <div className='mb-4'>
                    <label className='block text-gray-700 mb-2 font-semibold' htmlFor='email'>Email</label>
                    <input className='w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:ring-1 focus:border-none' type='email' id='email' placeholder='Enter your email' />
                </div>
                <div className='mb-6'>
                    <label className='block text-gray-700 mb-2 font-semibold' htmlFor='password'>Password</label>
                    <input className='w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:ring-1 focus:border-none' type='password' id='password' placeholder='Enter your password' />
                </div>
                <button className='w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 hover:cursor-pointer transition duration-200' type='submit'>Login</button>
            </form>
        </div>

    </div>
  )
}

export default LoginForm