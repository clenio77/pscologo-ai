import React from 'react';
import { Phone, Mail, ChevronRight } from 'lucide-react';
import type { Patient } from '../../services/api';
import { calculateAge } from '../../utils/formatters';

interface PatientCardProps {
  patient: Patient;
  onClick: () => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick }) => {
  return (
    <div className="patient-card card" onClick={onClick}>
      <div className="patient-avatar-badge">
        {patient.name.charAt(0).toUpperCase()}
      </div>
      <div className="patient-card-info">
        <h4>{patient.name}</h4>
        <span className="patient-age">{calculateAge(patient.birth_date)}</span>
        
        <div className="patient-contact-links">
          {patient.phone && (
            <div className="contact-item">
              <Phone size={14} />
              <span>{patient.phone}</span>
            </div>
          )}
          {patient.email && (
            <div className="contact-item">
              <Mail size={14} />
              <span>{patient.email}</span>
            </div>
          )}
        </div>
      </div>
      <ChevronRight className="card-arrow" size={20} />
    </div>
  );
};
