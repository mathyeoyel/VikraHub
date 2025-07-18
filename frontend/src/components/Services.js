import React, { useState, useEffect } from 'react';
import { serviceAPI } from '../api';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await serviceAPI.list();
        setServices(response.data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return <div className="text-center">Loading services...</div>;
  }

  return (
    <section id="services" className="services">
      <div className="container">
        <div className="section-title">
          <h2>Services</h2>
          <p>What we offer</p>
        </div>

        <div className="row">
          {services.map(service => (
            <div key={service.id} className="col-lg-4 col-md-6 d-flex align-items-stretch">
              <div className="icon-box">
                <div className="icon">
                  <i className={service.icon}></i>
                </div>
                <h4>{service.title}</h4>
                <p>{service.description}</p>
                {service.image && (
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="img-fluid service-image"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
