import axios from "axios"
import toast, { Toaster } from 'react-hot-toast';
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

const EmployeeLogin = () => {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()

    function handleOnSubmit(e){
        e.preventDefault()
        console.log(email, password)

        axios.post("http://localhost:5000/api/users/login", {
            email : email,
            password : password
        }).then((res)=>{
            console.log(res)
            toast.success("Login success")
            const user = res.data.user
            localStorage.setItem("token", res.data.token)
            if(user.role === "admin"){
              navigate("/admindashboard")
            }
            else if(user.role === "HR_MANAGER"){
              navigate("/employeedashboardhr")
            }
            else if(user.role === "DELIVERY_PERSON"){
              navigate("/employeedashboarddelivery")
            }
            else{
              navigate("/employeelogin")
            }


        }).catch((err)=>{
            console.log(err)
            toast.error(err.response.data.error)
        })
    }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Employee Login
        </h2>
        <form className="space-y-5" onSubmit={handleOnSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e)=>{
                setEmail(e.target.value)
              }}
              placeholder="employee@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="********"
              name="password"
              value={password}
              onChange={(e)=>{
                setPassword(e.target.value)
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  )
}

export default EmployeeLogin