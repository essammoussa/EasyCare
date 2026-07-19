import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getDoctor, getSlots, createBooking, updateAppointmentStatus, deleteAppointment } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './BookAppointment.css';

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rescheduleId = searchParams.get('reschedule');
  
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, slotRes] = await Promise.all([
          getDoctor(doctorId),
          getSlots(doctorId),
        ]);
        const available = (slotRes.data.slots || slotRes.data || []).filter((s) => !s.isBooked);
        const availableDates = [...new Set(available.map((slot) => slot.date).filter(Boolean))].sort();
        setDoctor(docRes.data.doctor || docRes.data);
        setSlots(available);
        setSelectedDate((prev) => (prev && availableDates.includes(prev) ? prev : (availableDates[0] || '')));
      } catch (err) {
        setError('Failed to load booking data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [doctorId]);

  const handleBook = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot.');
      return;
    }
    setBooking(true);
    setError('');
    try {
      await createBooking({ doctorId, slotId: selectedSlot._id || selectedSlot, notes });
      
      // If this is a reschedule, cancel and delete the old appointment
      if (rescheduleId) {
        try {
          // Cancel it first to release the slot
          await updateAppointmentStatus(rescheduleId, 'cancelled');
          // Then delete the old appointment from the history
          await deleteAppointment(rescheduleId);
        } catch (rescheduleErr) {
          console.error('Failed to clean up old appointment during reschedule:', rescheduleErr);
        }
        setSuccess('Appointment rescheduled successfully!');
        setTimeout(() => navigate('/patient/appointments'), 2000);
      } else {
        setSuccess('Appointment booked successfully!');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed.');
    } finally {
      setBooking(false);
    }
  };

  const name = doctor?.userId?.name || 'Doctor';
  const availableDates = [...new Set(slots.map((slot) => slot.date).filter(Boolean))].sort();
  const visibleSlots = slots.filter((slot) => slot.date === selectedDate);
  const formatDateLabel = (value) => {
    if (!value) return '';
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="book-page">
      <Navbar />
      <main className="book-main">
        <h1 className="book-title">Book Appointment</h1>

        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : (
          <>
            {/* Doctor Info */}
            {doctor && (
              <div className="book-doctor-card">
                <div className="book-doctor-avatar">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <p className="book-doctor-name">{name}</p>
                  <p className="book-doctor-specialty">{doctor.specialty}</p>
                </div>
              </div>
            )}

            {/* Date and Time Slots */}
            <div className="book-section">
              <h2 className="book-section-title">Select a Day and Time</h2>

              {availableDates.length > 0 ? (
                <>
                  <div className="book-date-picker-group">
                    <label className="book-date-label">Choose a day</label>
                    <input
                      type="date"
                      className="book-date-input"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(null);
                      }}
                    />
                  </div>

                  <div className="book-date-chips">
                    {availableDates.map((date) => (
                      <button
                        key={date}
                        type="button"
                        className={`book-date-chip ${selectedDate === date ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedSlot(null);
                        }}
                      >
                        {formatDateLabel(date)}
                      </button>
                    ))}
                  </div>

                  {selectedDate ? (
                    visibleSlots.length > 0 ? (
                      <div className="book-slots-grid">
                        {visibleSlots.map((slot, i) => {
                          const id = slot._id || i;
                          const isSelected = selectedSlot?._id === id || selectedSlot === id;
                          return (
                            <button
                              key={id}
                              className={`book-slot-btn${isSelected ? ' selected' : ''}`}
                              onClick={() => setSelectedSlot(slot)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px', verticalAlign: 'middle' }}>schedule</span>
                              {slot.startTime} - {slot.endTime}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="book-slots-empty">No available slots for {formatDateLabel(selectedDate)}.</p>
                    )
                  ) : (
                    <p className="book-slots-empty">Choose a date to view available slots.</p>
                  )}
                </>
              ) : (
                <p className="book-slots-empty">No available slots at the moment.</p>
              )}
            </div>

            {/* Notes */}
            <div className="book-section">
              <label className="book-notes-label">Notes (optional)</label>
              <textarea
                className="book-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes for the doctor..."
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="book-success">{success}</div>}

            <button
              className="book-submit-btn"
              onClick={handleBook}
              disabled={booking || !selectedSlot}
            >
              {booking ? 'Booking...' : 'Confirm Booking'}
            </button>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
