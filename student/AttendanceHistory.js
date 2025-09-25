import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaCalendarAlt, FaFilter, FaDownload, FaSearch, FaArrowLeft, FaSyncAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function AttendanceHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateFrom: null,
    dateTo: null,
    subject: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0
  });
  
  const navigate = useNavigate();
  
  // Fetch attendance history
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        
        // In a real app, you would fetch this from your API
        // const response = await axios.get('/api/attendance/student/history');
        
        // Mock data for demonstration
        setTimeout(() => {
          const mockData = [
            {
              id: '1',
              sessionId: 'sess1',
              subject: 'Mathematics',
              teacher: 'Dr. Smith',
              date: '2023-10-15T10:30:00Z',
              status: 'present',
              location: {
                latitude: 28.6139,
                longitude: 77.2090,
                name: 'Room 101, Main Building'
              }
            },
            {
              id: '2',
              sessionId: 'sess2',
              subject: 'Physics',
              teacher: 'Prof. Johnson',
              date: '2023-10-14T14:15:00Z',
              status: 'present',
              location: {
                latitude: 28.6139,
                longitude: 77.2090,
                name: 'Physics Lab, Science Block'
              }
            },
            {
              id: '3',
              sessionId: 'sess3',
              subject: 'Chemistry',
              teacher: 'Dr. Williams',
              date: '2023-10-12T09:00:00Z',
              status: 'late',
              location: {
                latitude: 28.6139,
                longitude: 77.2090,
                name: 'Chemistry Lab, Science Block'
              }
            },
            {
              id: '4',
              sessionId: 'sess4',
              subject: 'Mathematics',
              teacher: 'Dr. Smith',
              date: '2023-10-10T10:30:00Z',
              status: 'absent',
              location: null
            },
            {
              id: '5',
              sessionId: 'sess5',
              subject: 'Computer Science',
              teacher: 'Prof. Brown',
              date: '2023-10-08T13:45:00Z',
              status: 'present',
              location: {
                latitude: 28.6139,
                longitude: 77.2090,
                name: 'Computer Lab, IT Block'
              }
            }
          ];
          
          setAttendance(mockData);
          setFilteredAttendance(mockData);
          
          // Extract unique subjects
          const uniqueSubjects = [...new Set(mockData.map(item => item.subject))];
          setSubjects(uniqueSubjects);
          
          // Calculate stats
          const presentCount = mockData.filter(item => item.status === 'present').length;
          const lateCount = mockData.filter(item => item.status === 'late').length;
          const absentCount = mockData.filter(item => item.status === 'absent').length;
          
          setStats({
            total: mockData.length,
            present: presentCount,
            late: lateCount,
            absent: absentCount,
            attendanceRate: Math.round(((presentCount + lateCount) / mockData.length) * 100) || 0
          });
          
          setLoading(false);
        }, 800);
        
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setError('Failed to load attendance history. Please try again.');
        setLoading(false);
      }
    };
    
    fetchAttendance();
  }, []);
  
  // Apply filters
  useEffect(() => {
    if (!attendance.length) return;
    
    let result = [...attendance];
    
    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(item => item.status === filters.status);
    }
    
    // Apply subject filter
    if (filters.subject) {
      result = result.filter(item => 
        item.subject.toLowerCase().includes(filters.subject.toLowerCase())
      );
    }
    
    // Apply date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      
      result = result.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= fromDate;
      });
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      
      result = result.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate <= toDate;
      });
    }
    
    // Apply search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(item => 
        item.subject.toLowerCase().includes(searchTerm) ||
        item.teacher.toLowerCase().includes(searchTerm) ||
        item.status.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredAttendance(result);
  }, [filters, attendance]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      dateFrom: null,
      dateTo: null,
      subject: ''
    });
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <Badge bg="success">Present</Badge>;
      case 'late':
        return <Badge bg="warning" text="dark">Late</Badge>;
      case 'absent':
        return <Badge bg="danger">Absent</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };
  
  const exportToCSV = () => {
    if (!filteredAttendance.length) return;
    
    // Create CSV header
    let csvContent = 'data:text/csv;charset=utf-8,';
    const headers = ['Date', 'Subject', 'Teacher', 'Status', 'Location'];
    csvContent += headers.join(',') + '\r\n';
    
    // Add data rows
    filteredAttendance.forEach(item => {
      const row = [
        `"${formatDate(item.date)}"`,
        `"${item.subject}"`,
        `"${item.teacher}"`,
        `"${item.status.charAt(0).toUpperCase() + item.status.slice(1)}"`,
        `"${item.location?.name || 'N/A'}"`
      ];
      csvContent += row.join(',') + '\r\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (loading && !attendance.length) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading your attendance history...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            className="me-2"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="me-1" /> Back
          </Button>
          <h2 className="d-inline-block mb-0">Attendance History</h2>
        </div>
        
        <div>
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="me-2"
            onClick={exportToCSV}
            disabled={!filteredAttendance.length}
          >
            <FaDownload className="me-1" /> Export
          </Button>
          
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            <FaSyncAlt className="me-1" /> Refresh
          </Button>
        </div>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Stats Cards */}
      <Row className="mb-4 g-4">
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="display-5 text-primary fw-bold mb-1">
                {stats.total}
              </div>
              <div className="text-muted">Total Classes</div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="display-5 text-success fw-bold mb-1">
                {stats.present}
              </div>
              <div className="text-muted">Present</div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="display-5 text-warning fw-bold mb-1">
                {stats.late}
              </div>
              <div className="text-muted">Late</div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="display-5 text-danger fw-bold mb-1">
                {stats.absent}
              </div>
              <div className="text-muted">Absent</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Filters */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              <FaFilter className="me-2 text-primary" />
              Filters
            </h5>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          </div>
          
          <Row>
            <Col md={3} className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select 
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                size="sm"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </Form.Select>
            </Col>
            
            <Col md={3} className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Select 
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                size="sm"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject, index) => (
                  <option key={index} value={subject}>
                    {subject}
                  </option>
                ))}
              </Form.Select>
            </Col>
            
            <Col md={3} className="mb-3">
              <Form.Label>From Date</Form.Label>
              <DatePicker
                selected={filters.dateFrom}
                onChange={(date) => 
                  setFilters(prev => ({ ...prev, dateFrom: date }))
                }
                selectsStart
                startDate={filters.dateFrom}
                endDate={filters.dateTo}
                maxDate={filters.dateTo || new Date()}
                className="form-control form-control-sm"
                placeholderText="Start date"
                dateFormat="MMM d, yyyy"
              />
            </Col>
            
            <Col md={3} className="mb-3">
              <Form.Label>To Date</Form.Label>
              <DatePicker
                selected={filters.dateTo}
                onChange={(date) => 
                  setFilters(prev => ({ ...prev, dateTo: date }))
                }
                selectsEnd
                startDate={filters.dateFrom}
                endDate={filters.dateTo}
                minDate={filters.dateFrom}
                maxDate={new Date()}
                className="form-control form-control-sm"
                placeholderText="End date"
                dateFormat="MMM d, yyyy"
              />
            </Col>
            
            <Col md={12}>
              <Form.Group>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <Form.Control
                    type="text"
                    placeholder="Search by subject, teacher, or status..."
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Attendance Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading attendance records...</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <FaCalendarAlt size={48} className="text-muted" />
              </div>
              <h5>No attendance records found</h5>
              <p className="text-muted">
                {Object.values(filters).some(filter => 
                  filter && filter !== 'all' && filter !== ''
                ) ? (
                  'Try adjusting your filters'
                ) : (
                  'Your attendance records will appear here'
                )}
              </p>
              <Button 
                variant="outline-primary" 
                className="mt-2"
                onClick={() => navigate('/student/mark-attendance')}
              >
                Mark Attendance
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date & Time</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="d-flex flex-column">
                          <span>{formatDate(record.date).split(',')[0]}</span>
                          <small className="text-muted">
                            {formatDate(record.date).split(',').slice(1).join(',').trim()}
                          </small>
                        </div>
                      </td>
                      <td>{record.subject}</td>
                      <td>{record.teacher}</td>
                      <td>{getStatusBadge(record.status)}</td>
                      <td>
                        {record.location ? (
                          <span className="text-nowrap">
                            {record.location.name}
                          </span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => {
                            // In a real app, you would navigate to a detailed view
                            alert(`Details for ${record.subject} on ${formatDate(record.date)}`);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        
        {filteredAttendance.length > 0 && (
          <Card.Footer className="bg-white border-top d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              Showing {filteredAttendance.length} of {attendance.length} records
            </div>
            
            <div className="d-flex align-items-center">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="me-2"
                onClick={exportToCSV}
              >
                <FaDownload className="me-1" /> Export CSV
              </Button>
              
              <div className="btn-group">
                <Button variant="outline-secondary" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline-secondary" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </Card.Footer>
        )}
      </Card>
    </Container>
  );
}
