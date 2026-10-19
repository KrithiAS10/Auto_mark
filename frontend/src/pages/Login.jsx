import React from 'react';
import { useNavigate } from 'react-router-dom';
const Login = () => {
  const navigate = useNavigate();

  const handleContinue = (event) => {
    event.preventDefault();
    navigate('/order');
  };

  return (
    <>
      <div className="home">
        <h1 className="text-6xl">Auto-Mark</h1>
      </div>

      <form className="form" onSubmit={handleContinue}>
        <section>
          <label htmlFor="name">Customer Name:</label>
          <input
            id="name"
            name="name"
            required
            type="text"
            placeholder="John Alex"
          />
        </section>

        <section>
          <label htmlFor="c-name">Company Name:</label>
          <input
            id="c-name"
            name="c-name"
            required
            type="text"
            placeholder="Enter Company Name"
          />
        </section>

        <section>
          <label htmlFor="phone">Phone Number:</label>
          <input
            id="phone"
            name="phone"
            required
            type="text"
            placeholder="00000-00000"
          />
        </section>

        <section>
          <label htmlFor="date">Date:</label>
          <input
            id="date"
            name="date"
            required
            type="date"
          />
        </section>


        <section>
          <label htmlFor="place">Place:</label>
          <textarea
            id="place"
            name="place"
            required
            placeholder="Enter full Address"
          ></textarea>
        </section>

        <section>
          <label htmlFor="s-request">Service Request No.:</label>
          <input
            id="s-request"
            name="s-request"
            required
            type="text"
            placeholder="Enter Service Request No."
          />
        </section>

        <div className="buttons">
          <button
            type="reset"
            className="bg-white text-black px-5 py-2 rounded-lg hover:bg-red-300 transition"
          >
            Reset
          </button>

          <button
            type="submit"
            className="bg-white text-black px-5 py-2 rounded-lg hover:bg-green-300 transition"
          >
            Continue
          </button>
        </div>
      </form>
    </>
  );
};

export default Login;